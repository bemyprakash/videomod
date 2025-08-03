const express = require('express');
const Participant = require('../models/Participant');
const Submission = require('../models/Submission');
const { authenticateParticipant } = require('../middleware/auth');

const router = express.Router();

// Get overall leaderboard
router.get('/overall', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    // Calculate and update participant scores
    await updateParticipantScores();

    const participants = await Participant.find({
      registrationStatus: 'approved',
      isActive: true
    })
    .select('fullName schoolName schoolCity schoolState totalScore rank badges quarterlyReports eventsOrganized profilePicture')
    .sort({ totalScore: -1, registrationDate: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Update ranks based on current scores
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const currentRank = ((page - 1) * limit) + i + 1;
      
      if (participant.rank !== currentRank) {
        await Participant.findByIdAndUpdate(participant._id, { rank: currentRank });
        participant.rank = currentRank;
      }
    }

    const total = await Participant.countDocuments({
      registrationStatus: 'approved',
      isActive: true
    });

    // Get top performers for highlights
    const topPerformers = participants.slice(0, 3).map(p => ({
      rank: p.rank,
      fullName: p.fullName,
      schoolName: p.schoolName,
      location: `${p.schoolCity}, ${p.schoolState}`,
      totalScore: p.totalScore,
      badges: p.badges.length,
      eventsOrganized: p.eventsOrganized.length,
      profilePicture: p.profilePicture
    }));

    res.json({
      leaderboard: participants.map(p => ({
        rank: p.rank,
        fullName: p.fullName,
        schoolName: p.schoolName,
        location: `${p.schoolCity}, ${p.schoolState}`,
        totalScore: p.totalScore,
        badges: p.badges.length,
        quarterlyReports: p.quarterlyReports.length,
        eventsOrganized: p.eventsOrganized.length
      })),
      topPerformers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

// Get school-wise leaderboard
router.get('/schools', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const schoolStats = await Participant.aggregate([
      {
        $match: {
          registrationStatus: 'approved',
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            schoolName: '$schoolName',
            schoolCity: '$schoolCity',
            schoolState: '$schoolState'
          },
          participantCount: { $sum: 1 },
          totalScore: { $sum: '$totalScore' },
          averageScore: { $avg: '$totalScore' },
          totalEvents: { $sum: { $size: '$eventsOrganized' } },
          totalBadges: { $sum: { $size: '$badges' } },
          participants: {
            $push: {
              name: '$fullName',
              score: '$totalScore',
              rank: '$rank'
            }
          }
        }
      },
      {
        $project: {
          schoolName: '$_id.schoolName',
          location: { $concat: ['$_id.schoolCity', ', ', '$_id.schoolState'] },
          participantCount: 1,
          totalScore: 1,
          averageScore: { $round: ['$averageScore', 2] },
          totalEvents: 1,
          totalBadges: 1,
          topParticipant: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: '$participants',
                  sortBy: { score: -1 }
                }
              },
              0
            ]
          }
        }
      },
      {
        $sort: { averageScore: -1, totalScore: -1 }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Add ranks to schools
    schoolStats.forEach((school, index) => {
      school.rank = ((page - 1) * limit) + index + 1;
    });

    const totalSchools = await Participant.aggregate([
      {
        $match: {
          registrationStatus: 'approved',
          isActive: true
        }
      },
      {
        $group: {
          _id: '$schoolName'
        }
      },
      {
        $count: 'total'
      }
    ]);

    const total = totalSchools.length > 0 ? totalSchools[0].total : 0;

    res.json({
      schools: schoolStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('School leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching school leaderboard' });
  }
});

// Get state-wise leaderboard
router.get('/states', async (req, res) => {
  try {
    const stateStats = await Participant.aggregate([
      {
        $match: {
          registrationStatus: 'approved',
          isActive: true
        }
      },
      {
        $group: {
          _id: '$schoolState',
          participantCount: { $sum: 1 },
          schoolCount: { $addToSet: '$schoolName' },
          totalScore: { $sum: '$totalScore' },
          averageScore: { $avg: '$totalScore' },
          totalEvents: { $sum: { $size: '$eventsOrganized' } },
          totalBadges: { $sum: { $size: '$badges' } }
        }
      },
      {
        $project: {
          state: '$_id',
          participantCount: 1,
          schoolCount: { $size: '$schoolCount' },
          totalScore: 1,
          averageScore: { $round: ['$averageScore', 2] },
          totalEvents: 1,
          totalBadges: 1
        }
      },
      {
        $sort: { averageScore: -1, participantCount: -1 }
      }
    ]);

    // Add ranks to states
    stateStats.forEach((state, index) => {
      state.rank = index + 1;
    });

    res.json({ states: stateStats });
  } catch (error) {
    console.error('State leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching state leaderboard' });
  }
});

// Get category-wise leaderboards
router.get('/categories', async (req, res) => {
  try {
    const categories = {
      quarterlyReports: await getTopParticipants('quarterlyReports', 10),
      eventsOrganized: await getTopParticipants('eventsOrganized', 10),
      ideaContest: await getTopIdeaContestParticipants(10),
      badges: await getTopParticipants('badges', 10)
    };

    res.json({ categories });
  } catch (error) {
    console.error('Category leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching category leaderboards' });
  }
});

// Get participant's position and nearby rankings
router.get('/my-position', authenticateParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.participant._id)
      .select('fullName schoolName totalScore rank quarterlyReports eventsOrganized badges');

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update participant's current rank
    await updateParticipantScores();
    
    const betterPerformers = await Participant.countDocuments({
      registrationStatus: 'approved',
      isActive: true,
      totalScore: { $gt: participant.totalScore }
    });

    const currentRank = betterPerformers + 1;

    // Update rank if changed
    if (participant.rank !== currentRank) {
      await Participant.findByIdAndUpdate(participant._id, { rank: currentRank });
      participant.rank = currentRank;
    }

    // Get nearby participants (5 above and 5 below)
    const nearbyParticipants = await Participant.find({
      registrationStatus: 'approved',
      isActive: true
    })
    .select('fullName schoolName schoolCity schoolState totalScore')
    .sort({ totalScore: -1, registrationDate: 1 })
    .skip(Math.max(0, currentRank - 6))
    .limit(11);

    // Add ranks to nearby participants
    nearbyParticipants.forEach((p, index) => {
      p.rank = Math.max(1, currentRank - 5) + index;
    });

    const totalParticipants = await Participant.countDocuments({
      registrationStatus: 'approved',
      isActive: true
    });

    res.json({
      participant: {
        fullName: participant.fullName,
        schoolName: participant.schoolName,
        totalScore: participant.totalScore,
        rank: participant.rank,
        quarterlyReports: participant.quarterlyReports.length,
        eventsOrganized: participant.eventsOrganized.length,
        badges: participant.badges.length
      },
      position: {
        current: participant.rank,
        total: totalParticipants,
        percentile: Math.round(((totalParticipants - participant.rank + 1) / totalParticipants) * 100)
      },
      nearbyParticipants: nearbyParticipants.map(p => ({
        rank: p.rank,
        fullName: p.fullName,
        schoolName: p.schoolName,
        location: `${p.schoolCity}, ${p.schoolState}`,
        totalScore: p.totalScore,
        isCurrentUser: p._id.toString() === participant._id.toString()
      }))
    });
  } catch (error) {
    console.error('My position error:', error);
    res.status(500).json({ message: 'Server error fetching position' });
  }
});

// Get recent achievements
router.get('/recent-achievements', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent submissions with high scores
    const recentAchievements = await Submission.find({
      status: 'approved',
      score: { $gte: 80 }
    })
    .populate('participant', 'fullName schoolName schoolCity schoolState')
    .sort({ evaluatedAt: -1 })
    .limit(parseInt(limit))
    .select('title submissionType score evaluatedAt participant');

    const achievements = recentAchievements.map(submission => ({
      type: 'high_score_submission',
      title: `Excellent ${submission.submissionType.replace('_', ' ')} submission`,
      description: submission.title,
      participant: {
        name: submission.participant.fullName,
        school: submission.participant.schoolName,
        location: `${submission.participant.schoolCity}, ${submission.participant.schoolState}`
      },
      score: submission.score,
      date: submission.evaluatedAt
    }));

    res.json({ achievements });
  } catch (error) {
    console.error('Recent achievements error:', error);
    res.status(500).json({ message: 'Server error fetching recent achievements' });
  }
});

// Get leaderboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Participant.aggregate([
      {
        $match: {
          registrationStatus: 'approved',
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          totalSchools: { $addToSet: '$schoolName' },
          totalStates: { $addToSet: '$schoolState' },
          totalScore: { $sum: '$totalScore' },
          averageScore: { $avg: '$totalScore' },
          totalEvents: { $sum: { $size: '$eventsOrganized' } },
          totalBadges: { $sum: { $size: '$badges' } },
          totalQuarterlyReports: { $sum: { $size: '$quarterlyReports' } }
        }
      },
      {
        $project: {
          totalParticipants: 1,
          totalSchools: { $size: '$totalSchools' },
          totalStates: { $size: '$totalStates' },
          totalScore: 1,
          averageScore: { $round: ['$averageScore', 2] },
          totalEvents: 1,
          totalBadges: 1,
          totalQuarterlyReports: 1
        }
      }
    ]);

    const submissionStats = await Submission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const submissionsByStatus = {};
    submissionStats.forEach(stat => {
      submissionsByStatus[stat._id] = stat.count;
    });

    res.json({
      ...stats[0],
      submissions: submissionsByStatus,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

// Helper function to update participant scores
async function updateParticipantScores() {
  try {
    const participants = await Participant.find({
      registrationStatus: 'approved',
      isActive: true
    });

    for (const participant of participants) {
      await participant.calculateTotalScore();
      await participant.save();
    }
  } catch (error) {
    console.error('Error updating participant scores:', error);
  }
}

// Helper function to get top participants by category
async function getTopParticipants(field, limit) {
  const sizeField = `$${field}`;
  
  return await Participant.find({
    registrationStatus: 'approved',
    isActive: true
  })
  .select(`fullName schoolName schoolCity schoolState ${field} totalScore`)
  .sort({ [`${field}.length`]: -1, totalScore: -1 })
  .limit(limit)
  .then(participants => 
    participants.map((p, index) => ({
      rank: index + 1,
      fullName: p.fullName,
      schoolName: p.schoolName,
      location: `${p.schoolCity}, ${p.schoolState}`,
      count: p[field] ? p[field].length : 0,
      totalScore: p.totalScore
    }))
  );
}

// Helper function to get top idea contest participants
async function getTopIdeaContestParticipants(limit) {
  return await Submission.aggregate([
    {
      $match: {
        submissionType: 'idea_contest_entry',
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$participant',
        submissions: { $sum: 1 },
        averageScore: { $avg: '$score' },
        maxScore: { $max: '$score' }
      }
    },
    {
      $lookup: {
        from: 'participants',
        localField: '_id',
        foreignField: '_id',
        as: 'participant'
      }
    },
    {
      $unwind: '$participant'
    },
    {
      $match: {
        'participant.registrationStatus': 'approved',
        'participant.isActive': true
      }
    },
    {
      $project: {
        fullName: '$participant.fullName',
        schoolName: '$participant.schoolName',
        location: {
          $concat: ['$participant.schoolCity', ', ', '$participant.schoolState']
        },
        submissions: 1,
        averageScore: { $round: ['$averageScore', 2] },
        maxScore: 1
      }
    },
    {
      $sort: { averageScore: -1, maxScore: -1, submissions: -1 }
    },
    {
      $limit: limit
    }
  ]).then(results => 
    results.map((r, index) => ({
      rank: index + 1,
      ...r
    }))
  );
}

module.exports = router;
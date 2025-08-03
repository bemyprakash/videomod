import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Nature,
  School,
  EmojiEvents,
  Groups,
  Login,
  PersonAdd,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Nature sx={{ fontSize: { xs: 80, md: 120 }, mb: 4, opacity: 0.9 }} />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              mb: 3,
              lineHeight: 1.2,
            }}
          >
            Climate Champion Programme 2025
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              mb: 4,
              opacity: 0.9,
              lineHeight: 1.5,
              maxWidth: 800,
              mx: 'auto',
            }}
          >
            Nurturing a generation of proactive stewards for our planet through education, action, and recognition.
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              startIcon={<PersonAdd />}
              sx={{
                bgcolor: 'white',
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
                px: 4,
                py: 1.5,
              }}
            >
              Register Now
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              startIcon={<Login />}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
                px: 4,
                py: 1.5,
              }}
            >
              Login
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* About Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h2"
          textAlign="center"
          sx={{ mb: 2, color: theme.palette.primary.main }}
        >
          About the Programme
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 800, mx: 'auto' }}
        >
          A one-year initiative by Anant School for Climate Action that galvanizes youth across India
          towards climate awareness and action, creating a network of young environmental leaders.
        </Typography>

        <Stack spacing={3} direction={{ xs: 'column', md: 'row' }}>
          <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
            <CardContent>
              <Nature sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Climate Action
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drive real environmental change through organized climate events and sustainability initiatives.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
            <CardContent>
              <School sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Educational Impact
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Participate in workshops, submit quarterly reports, and enhance your environmental knowledge.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
            <CardContent>
              <EmojiEvents sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recognition & Awards
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compete in leaderboards, earn badges, and get recognized for your contributions.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
            <CardContent>
              <Groups sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Community Building
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connect with like-minded students and schools across India working towards sustainability.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Call to Action Section */}
      <Box sx={{ bgcolor: theme.palette.grey[50], py: 8 }}>
        <Container maxWidth="lg">
          <Stack spacing={4} direction={{ xs: 'column', md: 'row' }}>
            <Card sx={{ flex: 1, p: 3, textAlign: 'center' }}>
              <CardContent>
                <Groups sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                  For Students & Schools
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Join as a Climate Champion, submit reports, organize events, and compete with peers
                  across India for recognition and awards.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  startIcon={<PersonAdd />}
                >
                  Register as Participant
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, p: 3, textAlign: 'center' }}>
              <CardContent>
                <AdminPanelSettings sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                  For Administrators
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Manage participants, review submissions, track progress, and oversee the entire
                  Climate Champion Programme.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  onClick={() => navigate('/admin/login')}
                  startIcon={<Login />}
                >
                  Admin Login
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.dark,
          color: 'white',
          py: 4,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Anant School for Climate Action
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Built with ❤️ for a sustainable future
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
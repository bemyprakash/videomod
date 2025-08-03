import React from 'react';
import { Typography } from '@mui/material';

const ProfilePage: React.FC = () => {
  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Profile page coming soon...
      </Typography>
    </div>
  );
};

export default ProfilePage;
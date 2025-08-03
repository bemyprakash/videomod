import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const LoginPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh' 
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Participant Login
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Login page coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;
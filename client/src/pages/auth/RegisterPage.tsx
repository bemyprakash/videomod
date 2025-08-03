import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const RegisterPage: React.FC = () => {
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
          Participant Registration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Registration page coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default RegisterPage;
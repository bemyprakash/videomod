import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const AdminLoginPage: React.FC = () => {
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
          Admin Login
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Admin login page coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminLoginPage;
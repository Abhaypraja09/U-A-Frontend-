import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../store/apiSlice';
import { setCredentials } from '../store/authSlice';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: response.user, token: response.token }));
      
      // Redirect based on role
      if (response.user.role === 'employee' || response.user.role === 'worker') {
        navigate('/worker');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>Unnati Arts ERP</Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" mb={4}>Sign in to your account</Typography>
        
        <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField 
            label="Email or Staff ID" 
            variant="outlined" 
            fullWidth 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField 
            label="Password" 
            type="password" 
            variant="outlined" 
            fullWidth 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <Typography color="error" variant="body2" textAlign="center">Invalid credentials</Typography>}
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            size="large" 
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;

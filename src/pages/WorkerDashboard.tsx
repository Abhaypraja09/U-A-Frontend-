import React, { useState } from 'react';
import { Box, Typography, Button, Paper, TextField, MenuItem, CircularProgress, Alert } from '@mui/material';
import { useGetMachinesQuery, usePunchInMutation, usePunchOutMutation, useGetActiveSessionQuery } from '../store/apiSlice';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';

const WorkerDashboard: React.FC = () => {
  const { data: machines, isLoading: machinesLoading } = useGetMachinesQuery();
  const { data: activeSession, isLoading: sessionLoading, refetch } = useGetActiveSessionQuery();
  const [punchIn, { isLoading: punchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();
  
  const [selectedMachine, setSelectedMachine] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handlePunchIn = async () => {
    if (!selectedMachine) return alert("Please select a machine first");
    try {
      await punchIn({ machineId: selectedMachine, photoUrl: "https://example.com/mock-photo.jpg", gpsLocation: "28.7, 77.1" }).unwrap();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePunchOut = async () => {
    try {
      await punchOut().unwrap();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (sessionLoading || machinesLoading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Worker Portal</Typography>
        <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
      </Box>

      {activeSession ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Currently Punched In</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Machine: {activeSession.machine?.name || 'N/A'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 4 }}>
            Started at: {new Date(activeSession.checkIn).toLocaleTimeString()}
          </Typography>
          
          <Button 
            variant="contained" 
            color="error" 
            size="large" 
            fullWidth 
            onClick={handlePunchOut}
            disabled={punchingOut}
          >
            {punchingOut ? <CircularProgress size={24} /> : 'Punch Out (End Shift)'}
          </Button>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>Start Your Shift</Typography>
          
          <TextField 
            select
            label="Select Machine" 
            fullWidth 
            value={selectedMachine} 
            onChange={(e) => setSelectedMachine(e.target.value)} 
            sx={{ mb: 3 }}
          >
            {machines && machines.length > 0 ? (
              machines.map((m: any) => (
                <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>No machines available</MenuItem>
            )}
          </TextField>

          <Alert severity="info" sx={{ mb: 3 }}>
            Photo verification will happen automatically upon punching in.
          </Alert>

          <Button 
            variant="contained" 
            color="success" 
            size="large" 
            fullWidth 
            onClick={handlePunchIn}
            disabled={!selectedMachine || punchingIn}
          >
            {punchingIn ? <CircularProgress size={24} /> : 'Punch In (Start Shift)'}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default WorkerDashboard;

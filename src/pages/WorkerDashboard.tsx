import React, { useState } from 'react';
import { Box, Typography, Button, Paper, TextField, MenuItem, CircularProgress, Alert, Snackbar, Divider, Avatar } from '@mui/material';
import { useGetMachinesQuery, useGetProjectsQuery, usePunchInMutation, usePunchOutMutation, useGetActiveSessionQuery, useMachineClockInMutation } from '../store/apiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const ImageUploadBox = ({ label, onImageSelected }: { label: string, onImageSelected: (url: string) => void }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onImageSelected(url);
    }
  };

  return (
    <Box sx={{ flex: 1, minWidth: 100, textAlign: 'center' }}>
      <Box 
        component="label" 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: 120, 
          border: '2px dashed', 
          borderColor: preview ? 'success.main' : 'divider',
          borderRadius: 3,
          bgcolor: preview ? 'success.light' : 'rgba(0,0,0,0.02)',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
        }}
      >
        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
        {preview ? (
          <>
            <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Box sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'success.main', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon sx={{ color: 'white', fontSize: 16 }} />
            </Box>
          </>
        ) : (
          <>
            <PhotoCameraIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="textSecondary" fontWeight="bold">TAP TO UPLOAD</Typography>
          </>
        )}
      </Box>
      <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 'bold', color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  );
};

const WorkerDashboard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const { data: machines, isLoading: machinesLoading } = useGetMachinesQuery();
  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: activeSession, isLoading: sessionLoading, refetch } = useGetActiveSessionQuery();
  
  const [punchIn, { isLoading: punchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();
  const [machineClockIn, { isLoading: clockingIn }] = useMachineClockInMutation();
  
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [photos, setPhotos] = useState({ machine: '', unit: '', software: '' });
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success'|'error' });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const showToast = (message: string, severity: 'success'|'error' = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handlePunchIn = async () => {
    try {
      await punchIn({ gpsLocation: "28.7, 77.1", photoUrl: "https://example.com/staff-photo.jpg" }).unwrap();
      showToast("Shift Started successfully! You are now Punched In.");
      refetch();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to Punch In. Please try again.", 'error');
      console.error(err);
    }
  };

  const handleMachineClockIn = async () => {
    if (!selectedMachine) return showToast("Please select a machine", 'error');
    if (!selectedProject) return showToast("Please select a project/stone", 'error');
    if (!photos.machine || !photos.unit || !photos.software) {
      return showToast("Please upload all 3 mandatory photos", 'error');
    }
    
    try {
      await machineClockIn({ 
        machineId: selectedMachine, 
        projectId: selectedProject,
        machinePhotoUrl: photos.machine,
        unitPhotoUrl: photos.unit,
        softwarePhotoUrl: photos.software,
      }).unwrap();
      showToast("Machine Log started! Check Live Feed.");
      // Reset form
      setSelectedMachine('');
      setSelectedProject('');
      setPhotos({ machine: '', unit: '', software: '' });
      refetch();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to start machine log.", 'error');
      console.error(err);
    }
  };

  const handlePunchOut = async () => {
    try {
      await punchOut().unwrap();
      showToast("Shift Ended successfully! You are now Punched Out.");
      refetch();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to Punch Out.", 'error');
      console.error(err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (sessionLoading || machinesLoading) return <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'primary.main', color: 'white', borderBottomRadius: 24, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
            {user?.name?.charAt(0) || 'W'}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{user?.name || 'Worker Portal'}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>ID: {user?.staffId || '-'}</Typography>
          </Box>
        </Box>
        <Button variant="contained" color="error" onClick={handleLogout} sx={{ borderRadius: 8, boxShadow: 'none' }}>
          Logout
        </Button>
      </Paper>

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2 }}>
        
        {/* Step 1: Punch In / Out Card */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon /> Step 1: Factory Attendance
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {activeSession ? (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 3, py: 1, bgcolor: 'success.light', color: 'success.dark', borderRadius: 8, mb: 2, fontWeight: 'bold' }}>
                <CheckCircleIcon fontSize="small" /> PUNCHED IN
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Your shift started at <strong>{new Date(activeSession.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
              </Typography>
              <Button 
                variant="contained" 
                color="error" 
                size="large" 
                fullWidth 
                startIcon={punchingOut ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon />}
                onClick={handlePunchOut}
                disabled={punchingOut}
                sx={{ borderRadius: 3, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
              >
                {punchingOut ? 'Ending Shift...' : 'END SHIFT (PUNCH OUT)'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                You must punch in to record your daily attendance and start using machines.
              </Typography>
              <Button 
                variant="contained" 
                color="success" 
                size="large" 
                fullWidth 
                startIcon={punchingIn ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                onClick={handlePunchIn}
                disabled={punchingIn}
                sx={{ borderRadius: 3, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 8px 16px rgba(46,125,50,0.2)' }}
              >
                {punchingIn ? 'Starting Shift...' : 'START SHIFT (PUNCH IN)'}
              </Button>
            </Box>
          )}
        </Paper>

        {/* Step 2: Machine Selection (Only if Punched In) */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 4, opacity: activeSession ? 1 : 0.5, pointerEvents: activeSession ? 'auto' : 'none' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PrecisionManufacturingIcon /> Step 2: Start Machine Work
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Select your machine, assigned stone/task, and upload the 3 mandatory photos.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField 
              select
              label="1. Select Machine" 
              fullWidth 
              value={selectedMachine} 
              onChange={(e) => setSelectedMachine(e.target.value)} 
              InputProps={{ sx: { borderRadius: 3 } }}
            >
              {machines?.length ? machines.map((m: any) => (
                <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
              )) : <MenuItem value="" disabled>No machines</MenuItem>}
            </TextField>

            <TextField 
              select
              label="2. Select Task / Stone" 
              fullWidth 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)} 
              InputProps={{ sx: { borderRadius: 3 } }}
            >
              {projects?.filter((p: any) => p.status === 'work_order').map((p: any) => (
                <MenuItem key={p.id} value={p.id}>{p.projectId} - {p.name}</MenuItem>
              ))}
            </TextField>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>3. Upload Mandatory Photos</Typography>
              <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                <ImageUploadBox label="MACHINE" onImageSelected={(url) => setPhotos(p => ({ ...p, machine: url }))} />
                <ImageUploadBox label="STONE/UNIT" onImageSelected={(url) => setPhotos(p => ({ ...p, unit: url }))} />
                <ImageUploadBox label="SOFTWARE" onImageSelected={(url) => setPhotos(p => ({ ...p, software: url }))} />
              </Box>
            </Box>

            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              fullWidth 
              onClick={handleMachineClockIn}
              disabled={!selectedMachine || !selectedProject || !photos.machine || !photos.unit || !photos.software || clockingIn}
              sx={{ borderRadius: 3, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              {clockingIn ? <CircularProgress size={24} color="inherit" /> : 'START MACHINE LOG'}
            </Button>
          </Box>
        </Paper>

      </Box>

      {/* Global Snackbar for feedback */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%', borderRadius: 2, fontWeight: 'bold' }} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default WorkerDashboard;
import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useGetDispatchesQuery, useCreateDispatchMutation, useGetProjectsQuery } from '../store/apiSlice';

const Dispatch: React.FC = () => {
  const { data: dispatches, isLoading } = useGetDispatchesQuery();
  const { data: projects } = useGetProjectsQuery();
  const [createDispatch] = useCreateDispatchMutation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ projectId: '', vehicleNumber: '', driverDetails: '', lrNumber: '' });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      await createDispatch(formData).unwrap();
      handleClose();
      setFormData({ projectId: '', vehicleNumber: '', driverDetails: '', lrNumber: '' });
    } catch (err) {
      console.error('Failed to create dispatch', err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Logistics & Dispatch</Typography>
          <Typography variant="body2" color="textSecondary">Manage crate packing and transport assignments.</Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<LocalShippingIcon />} onClick={handleOpen} sx={{ borderRadius: 8 }}>
          New Dispatch
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell><strong>Project</strong></TableCell>
              <TableCell><strong>Vehicle Number</strong></TableCell>
              <TableCell><strong>Driver Details</strong></TableCell>
              <TableCell><strong>LR Number</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
            ) : dispatches?.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No dispatches found.</TableCell></TableRow>
            ) : (
              dispatches?.map((dispatch: any) => (
                <TableRow key={dispatch.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>{dispatch.project?.projectId || dispatch.projectId}</Typography>
                    <Typography variant="caption">{dispatch.project?.name || 'Unknown'}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{dispatch.vehicleNumber}</TableCell>
                  <TableCell>{dispatch.driverDetails || 'N/A'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{dispatch.lrNumber || 'N/A'}</TableCell>
                  <TableCell>{new Date(dispatch.dispatchDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</TableCell>
                  <TableCell>
                    <Chip 
                      label={dispatch.status.replace('_', ' ').toUpperCase()} 
                      color={dispatch.status === 'in_transit' ? 'warning' : 'success'} 
                      size="small" 
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dispatch Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create New Dispatch</DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              select
              label="Select Project" 
              fullWidth 
              value={formData.projectId} 
              onChange={(e) => setFormData({...formData, projectId: e.target.value})} 
            >
              {projects && projects.length > 0 ? (
                projects.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No projects available. Please create one first.</MenuItem>
              )}
            </TextField>
            <TextField 
              label="Vehicle Number" 
              fullWidth 
              value={formData.vehicleNumber} 
              onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} 
            />
            <TextField 
              label="Driver Details" 
              fullWidth 
              value={formData.driverDetails} 
              onChange={(e) => setFormData({...formData, driverDetails: e.target.value})} 
            />
            <TextField 
              label="LR Number" 
              fullWidth 
              value={formData.lrNumber} 
              onChange={(e) => setFormData({...formData, lrNumber: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={!formData.projectId}>Create Dispatch</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dispatch;

import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useGetProjectsQuery, useCreateProjectMutation } from '../store/apiSlice';

const Projects: React.FC = () => {
  const { data: projects, isLoading } = useGetProjectsQuery();
  const [createProject] = useCreateProjectMutation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'work_order' });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      await createProject(formData).unwrap();
      handleClose();
      setFormData({ name: '', description: '', status: 'work_order' });
    } catch (err) {
      console.error('Failed to create work order', err);
    }
  };

  // Only show active or completed work orders
  const workOrders = projects?.filter((p: any) => p.status === 'work_order' || p.status === 'completed') || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Active Work Orders</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: 8 }}>
          Direct Work Order
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'secondary.main' }}>
            <TableRow>
              <TableCell><strong>Work Order ID</strong></TableCell>
              <TableCell><strong>Project Name</strong></TableCell>
              <TableCell><strong>Client</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Start Date</strong></TableCell>
              <TableCell><strong>Manager</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
            ) : workOrders?.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No active work orders found.</TableCell></TableRow>
            ) : (
              workOrders?.map((project: any) => (
                <TableRow key={project.id} hover sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>{project.projectId}</Typography>
                  </TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.clientName || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={project.status.toUpperCase().replace('_', ' ')} 
                      color={project.status === 'work_order' ? 'warning' : 'success'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{project.assignedTo?.name || 'Unassigned'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Direct Work Order Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create Direct Work Order</DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              label="Project Name" 
              fullWidth 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
            <TextField 
              label="Description / Scope of Work" 
              fullWidth 
              multiline
              rows={3}
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Start Work Order</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;

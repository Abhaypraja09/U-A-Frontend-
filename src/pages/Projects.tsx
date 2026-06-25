import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, TablePagination } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useGetProjectsQuery, useCreateProjectMutation } from '../store/apiSlice';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useGetProjectsQuery();
  const [createProject] = useCreateProjectMutation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ name: '', clientName: '', description: '', status: 'work_order', totalPieces: 0, deliveryDate: '', clientHandle: '' });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : undefined
      };
      await createProject(payload).unwrap();
      handleClose();
      setFormData({ name: '', clientName: '', description: '', status: 'work_order', totalPieces: 0, deliveryDate: '', clientHandle: '' });
    } catch (err) {
      console.error('Failed to create work order', err);
    }
  };

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Only show active or completed work orders
  const workOrders = projects?.filter((p: any) => ['shop_drawing', 'material_planning', 'production', 'work_order', 'completed'].includes(p.status)) || [];

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#fcfbf9', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#222' }}>Active Work Orders</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>List of all active projects for the current month.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpen} 
          sx={{ 
            borderRadius: 8, 
            bgcolor: '#d59853', 
            color: '#fff',
            fontWeight: 'bold',
            px: 3,
            py: 1,
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(213,152,83,0.3)',
            '&:hover': { bgcolor: '#c28540' }
          }}
        >
          Direct Work Order
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#F3EAE1' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#444', py: 2 }}>Work Order ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#444', py: 2 }}>Client Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#444', py: 2 }}>Start Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#444', py: 2 }}>Total Pieces</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#444', py: 2 }}>Completed Pieces</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#444', py: 2 }}>Remaining Pieces</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#444', py: 2 }}>Delivery Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#444', py: 2 }}>Client Handle</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>Loading...</TableCell></TableRow>
            ) : workOrders?.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>No active work orders found.</TableCell></TableRow>
            ) : (
              workOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((project: any) => {
                const totalPieces = project.totalPieces || 0;
                const completedPieces = project.completedPieces || 0;
                const remainingPieces = Math.max(0, totalPieces - completedPieces);
                
                let deliveryDateColor = '#333';
                if (project.deliveryDate) {
                   const today = new Date();
                   const delivery = new Date(project.deliveryDate);
                   if (delivery < today) deliveryDateColor = '#d32f2f'; // overdue (red)
                   else if (delivery.getTime() - today.getTime() < 3 * 24 * 60 * 60 * 1000) deliveryDateColor = '#ed6c02'; // close (orange)
                   else deliveryDateColor = '#2e7d32'; // fine (green)
                }

                return (
                  <TableRow 
                    key={project.id} 
                    hover 
                    sx={{ 
                      cursor: 'pointer',
                      '& td': { borderBottom: '1px solid #f0f0f0', py: 2.5 }
                    }} 
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 'bold', color: '#d59853', fontSize: '0.95rem' }}>
                        {project.projectId}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#333' }}>{project.clientName || project.name || '-'}</TableCell>
                    <TableCell sx={{ color: '#555' }}>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ color: '#333', fontWeight: 'bold' }}>{totalPieces}</TableCell>
                    <TableCell align="center" sx={{ color: '#333' }}>{completedPieces}</TableCell>
                    <TableCell align="center" sx={{ color: '#333' }}>{remainingPieces}</TableCell>
                    <TableCell sx={{ color: deliveryDateColor, fontWeight: 'bold' }}>
                      {project.deliveryDate ? new Date(project.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#333' }}>{project.clientHandle || project.assignedTo?.name || '-'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #f0f0f0' }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontWeight: 'bold' }}>
            Total Work Orders: {workOrders.length}
          </Typography>
          <TablePagination
            component="div"
            count={workOrders.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderBottom: 'none' }}
          />
        </Box>
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
              label="Client Name" 
              fullWidth 
              value={formData.clientName} 
              onChange={(e) => setFormData({...formData, clientName: e.target.value})} 
            />
            <TextField 
              label="Description / Scope of Work" 
              fullWidth 
              multiline
              rows={3}
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="Total Pieces" 
                type="number"
                fullWidth 
                value={formData.totalPieces} 
                onChange={(e) => setFormData({...formData, totalPieces: parseInt(e.target.value) || 0})} 
              />
              <TextField 
                label="Delivery Date" 
                type="date"
                fullWidth 
                InputLabelProps={{ shrink: true }}
                value={formData.deliveryDate} 
                onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})} 
              />
            </Box>
            <TextField 
              label="Client Handle (Manager)" 
              fullWidth 
              value={formData.clientHandle} 
              onChange={(e) => setFormData({...formData, clientHandle: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#d59853', color: '#fff', '&:hover': { bgcolor: '#c28540' } }}>Start Work Order</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;

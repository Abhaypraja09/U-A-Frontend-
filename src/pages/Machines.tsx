import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import { useGetMachinesQuery, useAddMachineMutation, useDeleteMachineMutation } from '../store/apiSlice';

const Machines: React.FC = () => {
  const { data: machines, isLoading } = useGetMachinesQuery();
  const [addMachine] = useAddMachineMutation();
  const [deleteMachine] = useDeleteMachineMutation();

  const [open, setOpen] = useState(false);
  const [newMachine, setNewMachine] = useState({ name: '', type: 'CNC', hourlyCost: '', maintenanceIntervalHours: '200' });

  const handleAdd = async () => {
    try {
      await addMachine(newMachine).unwrap();
      setOpen(false);
      setNewMachine({ name: '', type: 'CNC', hourlyCost: '', maintenanceIntervalHours: '200' });
    } catch (err) {
      console.error('Failed to add machine', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      await deleteMachine(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Machine Master</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add Machine
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'secondary.main' }}>
            <TableRow>
              <TableCell><strong>Machine Name</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Hourly Cost (₹)</strong></TableCell>
              <TableCell><strong>Run Hours</strong></TableCell>
              <TableCell><strong>Service Due At</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} align="center">Loading...</TableCell></TableRow>
            ) : machines?.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No machines found.</TableCell></TableRow>
            ) : (
              machines?.map((machine: any) => {
                const needsMaintenance = (machine.totalRunHours || 0) >= (machine.maintenanceIntervalHours || 200);
                return (
                  <TableRow key={machine.id} hover>
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PrecisionManufacturingIcon color="action" /> {machine.name}
                    </TableCell>
                    <TableCell>{machine.type}</TableCell>
                    <TableCell>
                      <Chip 
                        label={needsMaintenance ? 'NEEDS SERVICE' : machine.status.toUpperCase()} 
                        color={needsMaintenance ? 'error' : (machine.status === 'active' ? 'success' : 'default')} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>₹{machine.hourlyCost}</TableCell>
                    <TableCell>{machine.totalRunHours?.toFixed(1) || 0} hrs</TableCell>
                    <TableCell>{machine.maintenanceIntervalHours} hrs</TableCell>
                    <TableCell align="right">
                      <Button color="error" size="small" onClick={() => handleDelete(machine.id)}>
                        <DeleteIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Machine Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Machine</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 400 }}>
            <TextField 
              label="Machine Name" 
              fullWidth 
              value={newMachine.name} 
              onChange={e => setNewMachine({...newMachine, name: e.target.value})} 
            />
            <TextField 
              select 
              label="Machine Type" 
              fullWidth 
              value={newMachine.type} 
              onChange={e => setNewMachine({...newMachine, type: e.target.value})}
            >
              <MenuItem value="CNC">CNC</MenuItem>
              <MenuItem value="Cutter">Edge Cutter</MenuItem>
              <MenuItem value="Polisher">Polishing Machine</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            <TextField 
              label="Hourly Cost (₹)" 
              type="number" 
              fullWidth 
              value={newMachine.hourlyCost} 
              onChange={e => setNewMachine({...newMachine, hourlyCost: e.target.value})} 
            />
            <TextField 
              label="Maintenance Interval (Hours)" 
              type="number" 
              fullWidth 
              value={newMachine.maintenanceIntervalHours} 
              onChange={e => setNewMachine({...newMachine, maintenanceIntervalHours: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Machines;

import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Tabs, Tab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useGetWorkOrdersQuery, useGetProjectsQuery, useGetMachinesQuery, useGetProductionLogsQuery, useCreateProductionLogMutation, useUpdateProductionLogMutation } from '../store/apiSlice';

const Production: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { data: workOrders, isLoading: workOrdersLoading, refetch: refetchWorkOrders } = useGetWorkOrdersQuery(undefined, { pollingInterval: 15000 });
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useGetProductionLogsQuery(undefined, { pollingInterval: 15000 });
  const { data: projects } = useGetProjectsQuery();
  const { data: machines } = useGetMachinesQuery();
  
  const [createLog] = useCreateProductionLogMutation();
  const [updateLog] = useUpdateProductionLogMutation();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ projectId: '', stage: 'cutting', machineId: '', remarks: '' });
  
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeData, setCompleteData] = useState({ id: '', quantityProduced: '', remarks: '' });

  const activeWorkOrders = projects?.filter((p: any) => p.status === 'work_order') || [];
  const activeMachines = machines?.filter((m: any) => m.status === 'active') || [];

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({ projectId: '', stage: 'cutting', machineId: '', remarks: '' });
  };

  const handleOpenComplete = (log: any) => {
    setCompleteData({ id: log.id, quantityProduced: '', remarks: log.remarks || '' });
    setCompleteOpen(true);
  };

  const handleCompleteSubmit = async () => {
    try {
      await updateLog({ 
        id: completeData.id, 
        data: { 
          quantityProduced: completeData.quantityProduced, 
          remarks: completeData.remarks 
        } 
      }).unwrap();
      setCompleteOpen(false);
      refetchLogs();
    } catch (err) {
      console.error('Failed to complete production log', err);
    }
  };

  const handleSubmit = async () => {
    try {
      await createLog(formData).unwrap();
      handleClose();
      refetchLogs();
    } catch (err) {
      console.error('Failed to create production log', err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Production Management</Typography>
          <Typography variant="body2" color="textSecondary">Track daily stages or view overall active work orders.</Typography>
        </Box>
        {tab === 0 && (
          <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={handleOpen} sx={{ borderRadius: 8 }}>
            Start New Stage
          </Button>
        )}
      </Box>

      <Paper sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Supervisor Logbook" />
          <Tab label="Active Work Orders" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell><strong>Work Order</strong></TableCell>
                <TableCell><strong>Stage</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Start Time</strong></TableCell>
                <TableCell><strong>Machine/Worker</strong></TableCell>
                <TableCell><strong>Output (Sq.Ft.)</strong></TableCell>
                <TableCell><strong>Remarks</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logsLoading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ p: 3 }}>Loading Supervisor Logbook...</TableCell></TableRow>
              ) : logs?.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ p: 3 }}>No production logs found.</TableCell></TableRow>
              ) : (
                logs?.map((log: any) => (
                  <TableRow key={log.id} hover sx={{ bgcolor: log.status === 'completed' ? 'rgba(76, 175, 80, 0.04)' : 'inherit' }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>{log.project?.projectId || log.projectId}</Typography>
                      <Typography variant="caption">{log.project?.name || 'Unknown Project'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.stage.toUpperCase()} 
                        color="secondary"
                        size="small" 
                        sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.status.toUpperCase()} 
                        color={log.status === 'in_progress' ? 'warning' : 'success'} 
                        size="small" 
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{new Date(log.startTime).toLocaleDateString()}</Typography>
                      <Typography variant="caption" color="textSecondary">{new Date(log.startTime).toLocaleTimeString()}</Typography>
                    </TableCell>
                    <TableCell>{log.machine?.name || 'Manual Labor'}</TableCell>
                    <TableCell>
                      {log.status === 'completed' ? (
                        <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>{log.quantityProduced} Sq.Ft.</Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">Pending</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.remarks || '-'}
                    </TableCell>
                    <TableCell align="right">
                      {log.status === 'in_progress' && (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success" 
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenComplete(log)}
                          sx={{ borderRadius: 6 }}
                        >
                          Record Output
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell><strong>Client's Demand</strong></TableCell>
                <TableCell><strong>Machine Used</strong></TableCell>
                <TableCell><strong>Time (Start - End)</strong></TableCell>
                <TableCell><strong>Date Range</strong></TableCell>
                <TableCell><strong>Total Usage Time</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workOrdersLoading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ p: 3 }}>Loading Active Work Orders...</TableCell></TableRow>
              ) : workOrders?.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ p: 3 }}>No active work orders found.</TableCell></TableRow>
              ) : (
                workOrders?.map((wo: any) => (
                  <TableRow key={wo.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>{wo.projectId}</Typography>
                      <Typography variant="body2">{wo.clientDemand}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={wo.machinesUsed} color="default" size="small" />
                    </TableCell>
                    <TableCell>
                      {wo.startTime && wo.endTime ? (
                        <Typography variant="body2">
                          {new Date(wo.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(wo.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Typography>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{wo.dateRange}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 'bold' }}>{wo.totalUsageTime}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={wo.status} 
                        color={wo.status === 'In Progress' ? 'warning' : 'success'} 
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
      )}

      {/* Start Production Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Start Production Stage</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              select
              fullWidth
              label="Select Active Work Order"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              {activeWorkOrders.map((p: any) => (
                <MenuItem key={p.id} value={p.id}>{p.projectId} - {p.name}</MenuItem>
              ))}
              {activeWorkOrders.length === 0 && <MenuItem disabled>No Active Work Orders</MenuItem>}
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                sx={{ flex: 1 }}
                label="Production Stage"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              >
                <MenuItem value="cutting">Cutting</MenuItem>
                <MenuItem value="cnc">CNC Routing</MenuItem>
                <MenuItem value="carving">Hand Carving</MenuItem>
                <MenuItem value="inlay">Inlay Work</MenuItem>
                <MenuItem value="polishing">Polishing</MenuItem>
                <MenuItem value="packing">Packing</MenuItem>
              </TextField>
              <TextField
                select
                sx={{ flex: 1 }}
                label="Assign Machine (Optional)"
                value={formData.machineId}
                onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
              >
                <MenuItem value=""><em>None (Manual Labor)</em></MenuItem>
                {activeMachines.map((m: any) => (
                  <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              fullWidth
              label="Remarks / Instructions"
              multiline
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!formData.projectId}>Start Stage</Button>
        </DialogActions>
      </Dialog>

      {/* Complete Production Dialog (Record Output) */}
      <Dialog open={completeOpen} onClose={() => setCompleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Record Daily Output</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Enter the total work done (in Sq.Ft. or Pieces) during this stage. This will feed into the factory performance reports.
            </Typography>
            <TextField
              fullWidth
              autoFocus
              type="number"
              label="Quantity Produced (Sq.Ft. / Pieces)"
              value={completeData.quantityProduced}
              onChange={(e) => setCompleteData({ ...completeData, quantityProduced: e.target.value })}
            />
            <TextField
              fullWidth
              label="Final Remarks"
              multiline
              rows={2}
              value={completeData.remarks}
              onChange={(e) => setCompleteData({ ...completeData, remarks: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setCompleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleCompleteSubmit} disabled={!completeData.quantityProduced}>End Stage & Save Output</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Production;

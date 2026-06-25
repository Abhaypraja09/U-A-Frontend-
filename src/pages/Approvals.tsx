import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CardMedia, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress, Alert, Snackbar } from '@mui/material';
import { useGetPendingApprovalsQuery, useApproveMaterialLogMutation, useGetProjectsQuery, useGetApprovedLogsQuery } from '../store/apiSlice';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import OutputIcon from '@mui/icons-material/Output';
import InputIcon from '@mui/icons-material/Input';

const Approvals: React.FC = () => {
  const { data: pendingLogs, isLoading, refetch } = useGetPendingApprovalsQuery(undefined, { pollingInterval: 5000 });
  const { data: approvedLogs, refetch: refetchApproved } = useGetApprovedLogsQuery(undefined, { pollingInterval: 5000 });
  const { data: projects } = useGetProjectsQuery();
  const [approveLog, { isLoading: isApproving }] = useApproveMaterialLogMutation();

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success'|'error' });

  const handleApproveClick = (log: any) => {
    setSelectedLog(log);
    setSelectedProject('');
    setApprovalDialogOpen(true);
  };

  const handleRejectClick = async (logId: string) => {
    try {
      await approveLog({ id: logId, data: { approvalStatus: 'rejected' } }).unwrap();
      setToast({ open: true, message: 'Log Rejected successfully', severity: 'success' });
      refetch();
    } catch (err: any) {
      setToast({ open: true, message: err?.data?.message || 'Failed to reject', severity: 'error' });
    }
  };

  const submitApproval = async () => {
    try {
      await approveLog({ id: selectedLog.id, data: { approvalStatus: 'approved', projectId: selectedProject } }).unwrap();
      setToast({ open: true, message: 'Log Approved successfully', severity: 'success' });
      setApprovalDialogOpen(false);
      refetch();
      refetchApproved();
    } catch (err: any) {
      setToast({ open: true, message: err?.data?.message || 'Failed to approve', severity: 'error' });
    }
  };

  if (isLoading) return <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PendingActionsIcon fontSize="large" color="warning" />
          Pending Approvals
        </Typography>
      </Box>

      {!pendingLogs || pendingLogs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">No pending approvals at the moment.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {pendingLogs.map((log: any) => (
            <Grid item xs={12} md={6} lg={4} key={log.id}>
              <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                  <Chip 
                    label={log.transactionType === 'OUT' ? 'MATERIAL OUT' : 'MATERIAL IN'} 
                    color={log.transactionType === 'OUT' ? 'warning' : 'info'} 
                    size="small" 
                    sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} 
                    icon={log.transactionType === 'OUT' ? <OutputIcon /> : <InputIcon />}
                  />
                </Box>
                <CardContent sx={{ pt: 4 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Stage: {log.stage}</span>
                    <span style={{ color: '#666' }}>Qty: {log.quantityProduced}</span>
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Worker/Vendor:</Typography>
                    {log.vendorName ? (
                      <Typography variant="body1" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>{log.vendorName} (Vendor)</Typography>
                    ) : (
                      <Typography variant="body1">{log.worker?.name || 'Unknown'}</Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                    Submitted: {new Date(log.createdAt).toLocaleString()}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 1 }}>
                    {log.startPhotos?.machine && (
                      <CardMedia 
                        component="img" 
                        image={log.startPhotos.machine} 
                        sx={{ width: 80, height: 80, borderRadius: 2, cursor: 'pointer', flexShrink: 0 }} 
                        onClick={() => setPreviewPhoto(log.startPhotos.machine)}
                      />
                    )}
                    {log.startPhotos?.unit && (
                      <CardMedia 
                        component="img" 
                        image={log.startPhotos.unit} 
                        sx={{ width: 80, height: 80, borderRadius: 2, cursor: 'pointer', flexShrink: 0 }} 
                        onClick={() => setPreviewPhoto(log.startPhotos.unit)}
                      />
                    )}
                    {log.startPhotos?.software && (
                      <CardMedia 
                        component="img" 
                        image={log.startPhotos.software} 
                        sx={{ width: 80, height: 80, borderRadius: 2, cursor: 'pointer', flexShrink: 0 }} 
                        onClick={() => setPreviewPhoto(log.startPhotos.software)}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="success" fullWidth onClick={() => handleApproveClick(log)} startIcon={<CheckCircleIcon />}>
                      Approve
                    </Button>
                    <Button variant="outlined" color="error" fullWidth onClick={() => handleRejectClick(log.id)} startIcon={<CancelIcon />}>
                      Reject
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Recently Approved Section */}
      <Box sx={{ mt: 6, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          Recently Approved (History)
        </Typography>
        <Typography variant="body2" color="textSecondary">
          These logs have been approved and moved to Production.
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <tr>
                <th style={{ padding: '16px', borderBottom: '1px solid #eee' }}>Transaction</th>
                <th style={{ padding: '16px', borderBottom: '1px solid #eee' }}>Stage</th>
                <th style={{ padding: '16px', borderBottom: '1px solid #eee' }}>Project</th>
                <th style={{ padding: '16px', borderBottom: '1px solid #eee' }}>Worker</th>
                <th style={{ padding: '16px', borderBottom: '1px solid #eee' }}>Qty</th>
                <th style={{ padding: '16px', borderBottom: '1px solid #eee' }}>Date Approved</th>
              </tr>
            </thead>
            <tbody>
              {approvedLogs?.length ? approvedLogs.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
                    <Chip 
                      label={log.transactionType === 'OUT' ? 'OUT' : 'IN'} 
                      color={log.transactionType === 'OUT' ? 'warning' : 'info'} 
                      size="small" 
                      sx={{ fontWeight: 'bold' }} 
                    />
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #eee' }}>{log.stage}</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
                    {log.project ? <Typography variant="body2" fontWeight="bold" color="primary">{log.project.projectId}</Typography> : '-'}
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
                    {log.vendorName ? (
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                        {log.vendorName} (Vendor)
                      </Typography>
                    ) : (
                      log.worker?.name || 'Unknown'
                    )}
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{log.quantityProduced}</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #eee', color: '#666' }}>{new Date(log.createdAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#666' }}>No approved logs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      </Paper>

      {/* Approval Dialog (Assign Project) */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Approve Material Log</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Please select the associated Project for this material log.
          </Typography>
          <TextField 
            select
            label="Assign Project" 
            fullWidth 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          >
            {projects?.map((p: any) => (
              <MenuItem key={p.id} value={p.id}>{p.projectId} - {p.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApprovalDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={submitApproval}
            disabled={!selectedProject || isApproving}
            sx={{ fontWeight: 'bold' }}
          >
            {isApproving ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fullscreen Photo Preview Dialog */}
      <Dialog open={!!previewPhoto} onClose={() => setPreviewPhoto(null)} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 2 }} onClick={() => setPreviewPhoto(null)}>
          <img src={previewPhoto || ''} alt="Preview" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
        </Box>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%' }} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Approvals;

import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, IconButton, Chip, Dialog, DialogContent, Avatar, CircularProgress, DialogTitle } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useGetLiveFeedQuery, useGetProjectsQuery, useApproveMachineLogMutation, useRejectMachineLogMutation } from '../store/apiSlice';
import { TextField, MenuItem, Button } from '@mui/material';

const SummaryCard = ({ icon: Icon, value, label, colorHint, bgHint }: any) => (
  <Paper sx={{ 
    p: 2, 
    borderRadius: 4, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 2,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 'none'
  }}>
    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: bgHint || 'primary.light', color: colorHint || 'primary.main', display: 'flex' }}>
      <Icon fontSize="medium" />
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1 }}>{value}</Typography>
      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>{label.toUpperCase()}</Typography>
    </Box>
  </Paper>
);

const LiveFeed: React.FC = () => {
  const { data: liveFeedData, isLoading, refetch } = useGetLiveFeedQuery(undefined, { pollingInterval: 15000 });
  const { data: projects } = useGetProjectsQuery();
  const [approveLog, { isLoading: isApproving }] = useApproveMachineLogMutation();
  const [rejectLog, { isLoading: isRejecting }] = useRejectMachineLogMutation();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  if (isLoading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  const activeLogs = liveFeedData?.filter((log: any) => log.status === 'active') || [];
  const activeStaffCount = new Set(activeLogs.filter((l:any) => l.operatorId).map((log: any) => log.operatorId)).size;
  const activeMachinesCount = new Set(activeLogs.filter((l:any) => l.machineId).map((log: any) => log.machineId)).size;

  return (
    <Box sx={{ minHeight: '100vh', p: 2, bgcolor: '#f4f7f6' }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5, color: '#1a1a1a' }}>Factory Live Feed</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5 }}>Real-time status of all machine operations today.</Typography>
        </Box>
      </Box>

      {/* Summary Metrics */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard icon={GroupsIcon} value={activeStaffCount} label="Active Workers" colorHint="success.main" bgHint="success.light" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard icon={PrecisionManufacturingIcon} value={activeMachinesCount} label="Active Machines" colorHint="primary.main" bgHint="primary.light" />
        </Grid>
      </Grid>

      {/* Grid of Cards */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#444' }}>Today's Logs</Typography>
      <Grid container spacing={3}>
        {liveFeedData?.length === 0 ? (
          <Grid size={{ xs: 12 }}><Typography align="center" color="textSecondary" sx={{ py: 8 }}>No machine logs for today.</Typography></Grid>
        ) : (
          liveFeedData?.map((log: any) => {
            const isCompleted = log.status === 'completed';
            const isPending = log.approvalStatus === 'pending';
            
            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={log.id}>
                <Paper 
                  onClick={() => setSelectedLog(log)}
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 4, 
                    border: '1px solid',
                    borderColor: isCompleted ? 'rgba(0,0,0,0.08)' : 'divider',
                    bgcolor: isCompleted ? '#fafafa' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isCompleted ? 0.8 : 1,
                    '&:hover': { 
                      transform: 'translateY(-4px)', 
                      borderColor: isCompleted ? '#ccc' : 'primary.main', 
                      boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                      opacity: 1
                    }
                  }}
                >
                  {/* Status Indicator Line */}
                  <Box sx={{ 
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, 
                    bgcolor: isCompleted ? 'grey.400' : (isPending ? 'warning.main' : 'success.main')
                  }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, pl: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: isCompleted ? 'grey.400' : 'primary.main', 
                        color: '#fff', width: 48, height: 48, fontWeight: 'bold',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}>
                        {log.operator?.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: isCompleted ? 'text.secondary' : 'text.primary' }}>
                          {log.operator?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 'bold', letterSpacing: 0.5 }}>
                          ID: {log.operator?.staffId || '-'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={isCompleted ? 'COMPLETED' : (isPending ? 'PENDING' : 'IN PROGRESS')} 
                      size="small" 
                      color={isCompleted ? 'default' : (isPending ? 'warning' : 'success')}
                      variant={isCompleted ? "outlined" : "filled"}
                      sx={{ fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: 0.5, borderRadius: 2 }} 
                    />
                  </Box>

                  <Box sx={{ bgcolor: isCompleted ? 'rgba(0,0,0,0.02)' : 'rgba(25,118,210,0.04)', p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 2 }}>
                    <Box>
                      <Typography component="div" variant="body2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: isCompleted ? 'text.secondary' : 'primary.dark' }}>
                        <PrecisionManufacturingIcon sx={{ fontSize: 16 }} />
                        {log.machine?.name || 'Unknown Machine'}
                      </Typography>
                      {log.project && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>
                          Project: {log.project.projectId}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right', borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1, color: isCompleted ? 'text.secondary' : 'success.main' }}>
                        {new Date(log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 'bold', display: 'block', mt: 0.5 }}>
                        {isCompleted && log.endTime ? new Date(log.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'IN PROGRESS'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Detailed Modal (Matches functional requirements but with standard theme) */}
      <Dialog 
        open={Boolean(selectedLog)} 
        onClose={() => setSelectedLog(null)} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        {selectedLog && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontWeight: 'bold' }}>
                  {selectedLog.operator?.name?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{selectedLog.operator?.name || 'Unknown'}</Typography>
                  <Typography variant="body2" color="textSecondary">Staff ID: {selectedLog.operator?.staffId || '-'}</Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setSelectedLog(null)}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, mt: 2 }}>
              {/* Inner Box */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                
                {/* Header Row: Shift & Machine */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip label="LOG #1" color="primary" variant="outlined" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
                    <Typography variant="body1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PrecisionManufacturingIcon color="warning" /> {selectedLog.machine?.name}
                    </Typography>
                  </Box>
                  <Chip 
                    label={selectedLog.status === 'completed' ? 'COMPLETED' : selectedLog.approvalStatus === 'pending' ? 'PENDING APPROVAL' : 'ON DUTY'} 
                    color={selectedLog.status === 'completed' ? 'default' : selectedLog.approvalStatus === 'pending' ? 'warning' : 'success'} 
                    sx={{ fontWeight: 'bold', borderRadius: 1 }} 
                  />
                </Box>

                <Grid container spacing={3}>
                  {/* PUNCH IN PANEL */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: '#fff', borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1, mb: 2 }}>
                        → PUNCH IN
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: -1 }}>
                        {new Date(selectedLog.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                      
                      {selectedLog.approvalStatus === 'pending' ? (
                        <Box sx={{ mb: 4, mt: 2 }}>
                          <TextField 
                            select
                            label="Assign Project / Work Order" 
                            fullWidth 
                            size="small"
                            value={selectedProject} 
                            onChange={(e) => setSelectedProject(e.target.value)} 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                          >
                            {projects?.filter((p: any) => ['shop_drawing', 'work_order', 'material_planning', 'production'].includes(p.status)).map((p: any) => (
                              <MenuItem key={p.id} value={p.id}>{p.projectId} - {p.name}</MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 4, fontWeight: 'bold' }}>
                          Project: {selectedLog.project?.name || selectedLog.project?.projectId || 'N/A'}
                        </Typography>
                      )}

                      {/* 3 Photos side-by-side */}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {[
                          { url: selectedLog.machinePhotoUrl, label: 'MACHINE' },
                          { url: selectedLog.unitPhotoUrl, label: 'STONE/UNIT' },
                          { url: selectedLog.softwarePhotoUrl, label: 'SOFTWARE' }
                        ].map((photo, i) => (
                          <Box key={i} sx={{ textAlign: 'center' }}>
                            <Box 
                              onClick={() => photo.url && setPreviewPhoto(photo.url)}
                              sx={{ 
                                width: 80, height: 80, borderRadius: 3, mb: 1, overflow: 'hidden', 
                                bgcolor: 'rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: photo.url ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                '&:hover': photo.url ? { transform: 'scale(1.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {}
                              }}>
                              {photo.url ? (
                                <img src={photo.url} alt={photo.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Typography variant="caption" color="textSecondary">No Image</Typography>
                              )}
                            </Box>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem', letterSpacing: 1 }}>
                              {photo.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* PUNCH OUT PANEL */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: '#fff', borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1, mb: 2 }}>
                        <CancelIcon fontSize="small" /> PUNCH OUT / ACTION
                      </Typography>
                      
                      {selectedLog.status === 'completed' ? (
                        <>
                          <Typography variant="h3" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: -1 }}>
                            {new Date(selectedLog.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                            "{selectedLog.remarks || 'No remarks provided'}"
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            {[
                              { url: selectedLog.endMachinePhotoUrl, label: 'END MACHINE' },
                              { url: selectedLog.endUnitPhotoUrl, label: 'END STONE' },
                              { url: selectedLog.endSoftwarePhotoUrl, label: 'END SOFT.' }
                            ].map((photo, i) => (
                              <Box key={i} sx={{ textAlign: 'center' }}>
                                <Box 
                                  onClick={() => photo.url && setPreviewPhoto(photo.url)}
                                  sx={{ 
                                    width: 80, height: 80, borderRadius: 3, mb: 1, overflow: 'hidden', 
                                    bgcolor: 'rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: photo.url ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                    '&:hover': photo.url ? { transform: 'scale(1.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {}
                                  }}>
                                  {photo.url ? (
                                    <img src={photo.url} alt={photo.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <Typography variant="caption" color="textSecondary">No Image</Typography>
                                  )}
                                </Box>
                                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem', letterSpacing: 1 }}>
                                  {photo.label}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          {selectedLog.approvalStatus === 'pending' ? (
                            <>
                              <Button 
                                variant="contained" 
                                color="success" 
                                fullWidth 
                                disabled={!selectedProject || isApproving}
                                startIcon={isApproving ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                                onClick={async () => {
                                  await approveLog({ id: selectedLog.id, projectId: selectedProject });
                                  refetch();
                                  setSelectedLog(null);
                                  setSelectedProject('');
                                }}
                                sx={{ mb: 1, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                              >
                                Approve & Assign
                              </Button>
                              <Button 
                                variant="outlined" 
                                color="error" 
                                fullWidth 
                                disabled={isRejecting}
                                startIcon={isRejecting ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />}
                                onClick={async () => {
                                  await rejectLog(selectedLog.id);
                                  refetch();
                                  setSelectedLog(null);
                                }}
                                sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                              >
                                Reject & Cancel Log
                              </Button>
                            </>
                          ) : (
                            <>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                              <Typography variant="body1" sx={{ color: 'warning.dark', fontWeight: 'bold', letterSpacing: 1 }}>IN PROGRESS</Typography>
                            </>
                          )}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>

              </Paper>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Photo Preview Fullscreen Dialog */}
      <Dialog open={Boolean(previewPhoto)} onClose={() => setPreviewPhoto(null)} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          <IconButton 
            onClick={() => setPreviewPhoto(null)} 
            sx={{ position: 'absolute', top: -40, right: -40, color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
          {previewPhoto && <img src={previewPhoto} alt="Preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }} />}
        </Box>
      </Dialog>
    </Box>
  );
};

export default LiveFeed;

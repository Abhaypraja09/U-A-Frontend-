import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, IconButton, Chip, Dialog, DialogContent, Avatar, CircularProgress, DialogTitle } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import { useGetLiveFeedQuery } from '../store/apiSlice';

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
  const { data: liveFeedData, isLoading } = useGetLiveFeedQuery(undefined, { pollingInterval: 15000 });
  const [selectedLog, setSelectedLog] = useState<any>(null);

  if (isLoading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

  const activeStaffCount = liveFeedData?.length || 0;
  const activeMachinesCount = new Set(liveFeedData?.map((log: any) => log.machine?.id)).size;

  return (
    <Box sx={{ minHeight: '100vh', p: 1 }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Factory Live Feed</Typography>
          <Typography variant="body2" color="textSecondary">Real-time status of workers and machines.</Typography>
        </Box>
      </Box>

      {/* Summary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard icon={GroupsIcon} value={activeStaffCount} label="Active Workers" colorHint="success.main" bgHint="success.light" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard icon={PrecisionManufacturingIcon} value={activeMachinesCount} label="Active Machines" colorHint="warning.main" bgHint="warning.light" />
        </Grid>
        {/* Placeholder cards to match layout */}
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard icon={DirectionsCarIcon} value="0" label="Idle Machines" colorHint="error.main" bgHint="error.light" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard icon={AccessTimeIcon} value="12h" label="Avg Shift Time" colorHint="info.main" bgHint="info.light" />
        </Grid>
      </Grid>

      {/* Filter / Search Bar area */}
      <Paper sx={{ 
        p: 2, mb: 4, borderRadius: 4, border: `1px solid`, borderColor: 'divider', boxShadow: 'none',
        display: 'flex', gap: 3, alignItems: 'center', overflowX: 'auto'
      }}>
         <Chip label={`WORKERS ${activeStaffCount}`} color="primary" sx={{ fontWeight: 'bold' }} />
         <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PrecisionManufacturingIcon fontSize="small" /> MACHINES <Chip size="small" label={activeMachinesCount} variant="outlined" /></Typography>
      </Paper>

      {/* Grid of Cards */}
      <Grid container spacing={3}>
        {liveFeedData?.length === 0 ? (
          <Grid item xs={12}><Typography textAlign="center" color="textSecondary">No active logs at the moment.</Typography></Grid>
        ) : (
          liveFeedData?.map((log: any) => (
            <Grid item xs={12} md={6} lg={4} key={log.id}>
              <Paper 
                onClick={() => setSelectedLog(log)}
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  border: `1px solid`,
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main', boxShadow: `0 4px 12px rgba(0,0,0,0.05)` }
                }}
              >
                {/* Subtle blue accent line on the left edge */}
                <Box sx={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 4, bgcolor: 'primary.main', borderRadius: '0 4px 4px 0' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, pl: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', width: 48, height: 48, fontWeight: 'bold' }}>
                      {log.operator?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{log.operator?.name || 'Unknown'}</Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        ID: {log.operator?.staffId || '-'}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label="PRESENT" 
                    size="small" 
                    color="success"
                    sx={{ fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: 0.5 }} 
                  />
                </Box>

                <Paper elevation={0} sx={{ bgcolor: 'rgba(0,0,0,0.02)', p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PrecisionManufacturingIcon sx={{ fontSize: 14, color: 'warning.dark' }} />
                      </Box>
                      {log.machine?.name || 'Unknown Machine'}
                      <Typography component="span" variant="caption" color="textSecondary">• {log.project?.name || 'Task'}</Typography>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'warning.dark', display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, fontWeight: 'bold', fontSize: '0.7rem' }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      ACTIVE DUTY
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      {new Date(log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">--- : ---</Typography>
                  </Box>
                </Paper>
              </Paper>
            </Grid>
          ))
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
                  <Chip label="ON DUTY" color="success" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
                </Box>

                <Grid container spacing={3}>
                  {/* PUNCH IN PANEL */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: '#fff', borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1, mb: 2 }}>
                        → PUNCH IN
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: -1 }}>
                        {new Date(selectedLog.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 4, fontWeight: 'bold' }}>
                        Project: {selectedLog.project?.name || selectedLog.project?.projectId || 'N/A'}
                      </Typography>

                      {/* 3 Photos side-by-side */}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {[
                          { url: selectedLog.machinePhotoUrl, label: 'MACHINE' },
                          { url: selectedLog.unitPhotoUrl, label: 'STONE/UNIT' },
                          { url: selectedLog.softwarePhotoUrl, label: 'SOFTWARE' }
                        ].map((photo, i) => (
                          <Box key={i} sx={{ textAlign: 'center' }}>
                            <Box sx={{ 
                              width: 80, height: 80, borderRadius: 3, mb: 1, overflow: 'hidden', 
                              bgcolor: 'rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
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
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: '#fff', borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                        <CancelIcon fontSize="small" /> PUNCH OUT
                      </Typography>
                      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                        <Typography variant="body1" sx={{ color: 'warning.dark', fontWeight: 'bold', letterSpacing: 1 }}>IN PROGRESS</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

              </Paper>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default LiveFeed;

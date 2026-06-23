import React from 'react';
import { Box, Typography, Paper, Button, Grid, Chip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssuredWorkloadIcon from '@mui/icons-material/AssuredWorkload';
import GroupIcon from '@mui/icons-material/Group';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ShieldIcon from '@mui/icons-material/Shield';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useGetDashboardSummaryQuery, useGetLiveFeedQuery } from '../store/apiSlice';

const DashboardCard = ({ icon: Icon, title, value, colorHint = 'primary.main', bgHint = 'secondary.main' }: any) => (
  <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
    <Box sx={{ display: 'flex', mb: 2 }}>
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: bgHint, color: colorHint, display: 'flex' }}>
        <Icon fontSize="medium" />
      </Box>
    </Box>
    <Typography variant="overline" color="textSecondary" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 'auto' }}>
      {value}
    </Typography>
  </Paper>
);

const Dashboard: React.FC = () => {
  const { data: summary, isLoading } = useGetDashboardSummaryQuery();
  const { data: liveFeed, isLoading: feedLoading } = useGetLiveFeedQuery(undefined, { pollingInterval: 10000 });

  const handleExport = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dashboard/export/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  if (isLoading) return <Typography>Loading Dashboard...</Typography>;

  return (
    <Box>
      {/* Top Banner - LogKaro Style */}
      <Paper sx={{ 
        bgcolor: '#2A2A2A', // Dark charcoal to contrast with cream
        color: '#FFFFFF', 
        borderRadius: 4, 
        p: 3, 
        mb: 4, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 3 }}>
            <ShieldIcon sx={{ color: 'primary.main', fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold', letterSpacing: 1.5, display: 'block', lineHeight: 1 }}>
              UNNATI ARTS ERP
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>
              Executive Dashboard
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" startIcon={<PictureAsPdfIcon />} onClick={() => handleExport('pdf')} sx={{ borderRadius: 8 }}>
            Export Report
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard icon={GroupIcon} title="TOTAL ENQUIRIES" value={summary?.totalLeads || 0} />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard icon={DashboardIcon} title="ACTIVE WORK ORDERS" value={summary?.activeProjects || 0} />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard icon={ReceiptIcon} title="PENDING QUOTATIONS" value={0} />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard icon={MonetizationOnIcon} title="ADVANCE PAYMENTS" value={`₹${summary?.pendingInvoicesTotal || 0}`} colorHint="success.main" bgHint="success.light" />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard icon={AssuredWorkloadIcon} title="DISPATCH READY" value={summary?.readyForDispatch || 0} colorHint="info.main" bgHint="info.light" />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard icon={MonetizationOnIcon} title="NET PROFIT" value={`₹${summary?.profitability?.netProfit?.toLocaleString() || 0}`} colorHint="success.main" bgHint="success.light" />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard icon={PrecisionManufacturingIcon} title="FACTORY EXPENSES" value={`₹${summary?.profitability?.factoryExpenses?.toLocaleString() || 0}`} colorHint="error.main" bgHint="error.light" />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard icon={GroupIcon} title="LABOR COST" value={`₹${summary?.profitability?.laborCost?.toLocaleString() || 0}`} colorHint="warning.main" bgHint="warning.light" />
        </Grid>
      </Grid>

      {/* Live Factory Feed Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PrecisionManufacturingIcon color="primary" fontSize="large" />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Live Factory Feed</Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 4 }}>
        {feedLoading ? <Typography>Loading Live Feed...</Typography> : (
          <Grid container spacing={2}>
            {liveFeed?.length === 0 && <Typography p={2}>No machines configured.</Typography>}
            {liveFeed?.map((machine: any) => (
              <Grid xs={12} sm={6} md={4} lg={3} key={machine.id}>
                <Paper 
                  elevation={machine.status === 'active' ? 2 : 0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    border: '1px solid', 
                    borderColor: machine.status === 'active' ? 'success.main' : 'divider',
                    bgcolor: machine.status === 'active' ? '#F4FBF5' : 'background.paper'
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 'bold' }}>{machine.name}</Typography>
                      {(machine.totalRunHours || 0) >= (machine.maintenanceIntervalHours || 200) && (
                        <Chip label="SERVICE DUE" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />
                      )}
                    </Box>
                    <Box sx={{ 
                      width: 12, height: 12, borderRadius: '50%', 
                      bgcolor: machine.status === 'active' ? 'success.main' : 'error.main' 
                    }} />
                  </Box>
                  {machine.status === 'active' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">Worker: <strong>{machine.currentWorker?.name}</strong></Typography>
                      <Typography variant="body2" color="text.secondary">Project: <strong>{machine.currentProject || 'Unknown'}</strong></Typography>
                      <Typography variant="body2" color="text.secondary">Stage: <strong>{machine.currentStage || 'N/A'}</strong></Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, bgcolor: 'rgba(0,0,0,0.05)', p: 0.5, borderRadius: 1, display: 'inline-block', width: 'fit-content' }}>
                        Started: {new Date(machine.sessionStartedAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Machine is Idle</Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;

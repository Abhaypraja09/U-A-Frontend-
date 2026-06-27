import React, { useState } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, 
  Button, Grid, TextField, Tabs, Tab, Tooltip, Snackbar, Alert,
  DialogActions, MenuItem, LinearProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { 
  useGetMachineLogsQuery, 
  useGetApprovedLogsQuery, 
  useUpdateMaterialLogMutation,
  useEditMachineLogMutation,
  useDeleteMachineLogMutation,
  useEditProductionLogMutation,
  useDeleteProductionLogMutation
} from '../store/apiSlice';
import { Select, MenuItem as MuiMenuItem, InputAdornment, FormControl } from '@mui/material';

const LogBook = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Material Log state
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedMaterialLog, setSelectedMaterialLog] = useState<any>(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<any>(null);

  const formattedDateParam = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  
  const { data: allLogs, isLoading } = useGetMachineLogsQuery();
  const { data: approvedLogs, isLoading: materialLoading, refetch: refetchApprovedLogs } = useGetApprovedLogsQuery(undefined, { pollingInterval: 10000 });
  const [updateMaterialLog, { isLoading: isReturning }] = useUpdateMaterialLogMutation();
  
  const [editMachineLog] = useEditMachineLogMutation();
  const [deleteMachineLog] = useDeleteMachineLogMutation();
  const [editProductionLog] = useEditProductionLogMutation();
  const [deleteProductionLog] = useDeleteProductionLogMutation();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [logToEdit, setLogToEdit] = useState<any>(null);
  const [editQty, setEditQty] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  const handleDeleteSubmit = async () => {
    try {
      if (activeTab === 0) {
        await deleteMachineLog(logToDelete.id).unwrap();
      } else {
        await deleteProductionLog(logToDelete.id).unwrap();
      }
      setSnackbar({ open: true, message: 'Log deleted successfully.', severity: 'success' });
      setDeleteConfirmOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete log.', severity: 'error' });
    }
  };

  const handleEditSubmit = async () => {
    try {
      if (activeTab === 0) {
        await editMachineLog({ id: logToEdit.id, data: { quantityProduced: editQty, remarks: editRemarks } }).unwrap();
      } else {
        await editProductionLog({ id: logToEdit.id, data: { quantityProduced: editQty } }).unwrap();
      }
      setSnackbar({ open: true, message: 'Log updated successfully.', severity: 'success' });
      setEditDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update log.', severity: 'error' });
    }
  };

  // Machine Logs filtering
  const logs = React.useMemo(() => {
    if (!allLogs) return [];
    let filtered = allLogs;
    if (viewMode === 'day') {
      const targetDate = formattedDateParam;
      filtered = filtered.filter((log: any) => {
        const logDate = new Date(log.startTime);
        const logFormatted = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
        return logFormatted === targetDate;
      });
    } else {
      filtered = filtered.filter((log: any) => {
        const logDate = new Date(log.startTime);
        return logDate.getMonth() === selectedMonth && logDate.getFullYear() === selectedYear;
      });
    }
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter((log: any) => 
        (log.project?.clientName || '').toLowerCase().includes(lowerQ) ||
        (log.machine?.name || '').toLowerCase().includes(lowerQ) ||
        (log.project?.name || '').toLowerCase().includes(lowerQ) ||
        (log.status || '').toLowerCase().includes(lowerQ)
      );
    }
    return filtered;
  }, [allLogs, viewMode, selectedDate, selectedMonth, selectedYear, searchQuery, formattedDateParam]);

  // Material Logs — only OUT type with tracking
  const materialLogs = React.useMemo(() => {
    if (!approvedLogs) return [];
    let filtered = approvedLogs.filter((log: any) => log.transactionType === 'OUT');
    if (materialSearchQuery) {
      const lowerQ = materialSearchQuery.toLowerCase();
      filtered = filtered.filter((log: any) =>
        (log.project?.clientName || '').toLowerCase().includes(lowerQ) ||
        (log.project?.projectId || '').toLowerCase().includes(lowerQ) ||
        (log.stage || '').toLowerCase().includes(lowerQ)
      );
    }
    return filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [approvedLogs, materialSearchQuery]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = [2024, 2025, 2026, 2027, 2028];

  const formatDMY = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  };

  const getReturnStatus = (log: any) => {
    const qtyOut = log.quantityProduced || 0;
    const qtyIn = log.returnedQty || 0;
    if (qtyIn === 0) return { label: 'PENDING', color: 'error' as const, progress: 0 };
    if (qtyIn >= qtyOut) return { label: 'COMPLETE', color: 'success' as const, progress: 100 };
    return { label: 'PARTIAL', color: 'warning' as const, progress: Math.round((qtyIn / qtyOut) * 100) };
  };

  const handleReturnSubmit = async () => {
    if (!selectedMaterialLog || !returnQty) return;
    try {
      await updateMaterialLog({
        id: selectedMaterialLog.id,
        returnedQty: Number(returnQty),
        returnDate: returnDate
      }).unwrap();
      setSnackbar({ open: true, message: `${returnQty} pieces return recorded successfully!`, severity: 'success' });
      setReturnDialogOpen(false);
      setReturnQty('');
      setSelectedMaterialLog(null);
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.data?.message || 'Failed to record return.', severity: 'error' });
    }
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', p: { xs: 2, md: 4 } }}>
      
      {/* Header Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', p: 1.5, borderRadius: 2, border: '1px solid rgba(46, 125, 50, 0.2)' }}>
            <CalendarTodayIcon sx={{ color: '#2E7D32' }} />
          </Box>
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 1 }}>
              OPERATIONAL INSIGHTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
              Overall Log Book
            </Typography>
          </Box>
        </Box>

        {/* Filters — only show for Machine Log tab */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              type="date"
              value={formattedDateParam}
              onChange={(e) => {
                if (e.target.value) { setSelectedDate(new Date(e.target.value)); setViewMode('day'); }
              }}
              size="small"
              sx={{ bgcolor: viewMode === 'day' ? 'rgba(46, 125, 50, 0.05)' : '#fff', width: 150,
                '& .MuiOutlinedInput-root': { borderRadius: 8, '& fieldset': { borderColor: viewMode === 'day' ? 'primary.main' : 'divider' } }
              }}
            />
            <Box sx={{ width: '1px', height: 30, bgcolor: 'divider', mx: 1 }} />
            <TextField
              placeholder="Search Logs..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ bgcolor: '#fff', width: 200, '& .MuiOutlinedInput-root': { borderRadius: 8, '& fieldset': { borderColor: 'divider' } } }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small">
                <Select value={selectedMonth} onChange={(e) => { setSelectedMonth(Number(e.target.value)); setViewMode('month'); }}
                  sx={{ borderRadius: 8, bgcolor: '#fff', minWidth: 80, '& fieldset': { borderColor: viewMode === 'month' ? 'primary.main' : 'divider' } }}>
                  {months.map((m, i) => <MuiMenuItem key={m} value={i}>{m}</MuiMenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small">
                <Select value={selectedYear} onChange={(e) => { setSelectedYear(Number(e.target.value)); setViewMode('month'); }}
                  sx={{ borderRadius: 8, bgcolor: '#fff', minWidth: 90, '& fieldset': { borderColor: viewMode === 'month' ? 'primary.main' : 'divider' } }}>
                  {years.map(y => <MuiMenuItem key={y} value={y}>{y}</MuiMenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Button variant={viewMode === 'month' ? "contained" : "outlined"} onClick={() => setViewMode('month')}
              startIcon={<CalendarMonthIcon />}
              sx={{ borderRadius: 8, px: 3, py: 0.8, fontWeight: 'bold', color: viewMode === 'month' ? '#fff' : '#f59e0b',
                bgcolor: viewMode === 'month' ? '#f59e0b' : '#fff', borderColor: '#f59e0b',
                '&:hover': { bgcolor: viewMode === 'month' ? '#d97706' : 'rgba(245,158,11,0.05)', borderColor: '#f59e0b' }
              }}>
              FULL MONTH
            </Button>
          </Box>
        )}
        {activeTab === 1 && (
          <TextField
            placeholder="Search by client, project..."
            size="small"
            value={materialSearchQuery}
            onChange={(e) => setMaterialSearchQuery(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            sx={{ bgcolor: '#fff', width: 260, '& .MuiOutlinedInput-root': { borderRadius: 8, '& fieldset': { borderColor: 'divider' } } }}
          />
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', fontSize: '0.95rem' } }}>
          <Tab label="🏭  Machine Log" />
          <Tab label="📦  Material Outward / Return Log" icon={
            materialLogs.filter((l: any) => (l.returnedQty || 0) < (l.quantityProduced || 0)).length > 0
              ? <Chip label={materialLogs.filter((l: any) => (l.returnedQty || 0) < (l.quantityProduced || 0)).length} size="small" color="error" sx={{ ml: 1 }} />
              : undefined
          } iconPosition="end" />
        </Tabs>
      </Box>

      {/* TAB 1: Machine Log */}
      {activeTab === 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, bgcolor: '#FDFBF7' }}>
            <Typography sx={{ color: 'text.primary', fontWeight: 'bold' }}>Machine Log</Typography>
            <Typography sx={{ color: 'text.secondary' }}>{logs?.length || 0} records • {viewMode === 'day' ? formatDMY(selectedDate) : `${months[selectedMonth]} ${selectedYear}`}</Typography>
          </Box>
          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>CLIENT</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>MACHINE</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>PUNCH IN</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>PUNCH OUT</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>QTY</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>HOURS</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 5 }}>Loading logs...</TableCell></TableRow>
                ) : (!logs || logs.length === 0) ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 5 }}>No logs found for this date.</TableCell></TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id} sx={{ '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.02)' } }}>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>
                        {formatDMY(new Date(log.startTime))}
                      </TableCell>
                      {/* CLIENT — separate bold row */}
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                          {log.project?.clientName || 'Walk-in'}
                        </Typography>
                        {log.project?.projectId && (
                          <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'primary.main' }}>
                            {log.project.projectId}
                          </Typography>
                        )}
                      </TableCell>
                      {/* MACHINE — separate bold row */}
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#5c4033' }}>
                          {log.machine?.name || '—'}
                        </Typography>
                        {log.worker?.name && (
                          <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                            {log.worker.name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: '#2E7D32', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ArrowOutwardIcon fontSize="small" /> {formatTime(log.startTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.endTime ? (
                          <Typography sx={{ color: '#1976D2', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CallReceivedIcon fontSize="small" /> {formatTime(log.endTime)}
                          </Typography>
                        ) : (
                          <Chip label="ON DUTY" size="small" sx={{ bgcolor: 'rgba(237,108,2,0.1)', color: '#ed6c02', fontWeight: 'bold', fontSize: '0.7rem' }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontWeight: 900, color: 'text.primary' }}>{log.quantityProduced || 0}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>PCS</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {(((log.endTime ? new Date(log.endTime) : new Date()).getTime() - new Date(log.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2)} hrs
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton onClick={() => setSelectedLog(log)} size="small"
                              sx={{ color: 'primary.main', bgcolor: 'rgba(25,118,210,0.08)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(25,118,210,0.18)' } }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => { setLogToEdit(log); setEditQty(log.quantityProduced || ''); setEditRemarks(log.remarks || ''); setEditDialogOpen(true); }}
                              sx={{ color: '#ed6c02', bgcolor: 'rgba(237,108,2,0.08)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(237,108,2,0.18)' } }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => { setLogToDelete(log); setDeleteConfirmOpen(true); }}
                              sx={{ color: 'error.main', bgcolor: 'rgba(211,47,47,0.08)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(211,47,47,0.18)' } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* TAB 2: Material Outward / Return Log */}
      {activeTab === 1 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FDFBF7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ color: 'text.primary', fontWeight: 'bold' }}>Material Outward / Return Log</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                {materialLogs.length} entries • {materialLogs.filter((l: any) => (l.returnedQty || 0) < (l.quantityProduced || 0)).length} pending returns
              </Typography>
            </Box>
            <LocalShippingIcon sx={{ color: '#8B4513', opacity: 0.5, fontSize: 32 }} />
          </Box>
          <TableContainer>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>DATE OUT</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>CLIENT</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>STAGE / WORK</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>QTY OUT</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>QTY IN (RETURNED)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>PENDING</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>STATUS</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {materialLoading ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}>Loading material logs...</TableCell></TableRow>
                ) : materialLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>No material outward logs found.</TableCell></TableRow>
                ) : (
                  materialLogs.map((log: any) => {
                    const qtyOut = log.quantityProduced || 0;
                    const qtyIn = log.returnedQty || 0;
                    const pending = Math.max(0, qtyOut - qtyIn);
                    const status = getReturnStatus(log);
                    return (
                      <TableRow key={log.id} sx={{ '&:hover': { bgcolor: 'rgba(139,69,19,0.02)' } }}>
                        <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                            {log.project?.clientName || '—'}
                          </Typography>
                          {log.project?.projectId && (
                            <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'primary.main' }}>
                              {log.project.projectId}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                            {log.stage}
                          </Typography>
                          {(log.vendorName || log.worker?.name) && (
                            <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                              {log.vendorName ? `${log.vendorName} (Vendor)` : log.worker?.name}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={qtyOut} sx={{ fontWeight: 900, bgcolor: 'rgba(237,108,2,0.1)', color: '#ed6c02', fontSize: '0.85rem' }} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={qtyIn} sx={{ fontWeight: 900, bgcolor: qtyIn > 0 ? 'rgba(46,125,50,0.1)' : 'rgba(0,0,0,0.05)', color: qtyIn > 0 ? '#2E7D32' : 'text.secondary', fontSize: '0.85rem' }} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          {pending > 0 ? (
                            <Box>
                              <Chip label={pending} color="error" size="small" sx={{ fontWeight: 900, fontSize: '0.85rem' }} />
                              <Box sx={{ mt: 0.5 }}>
                                <LinearProgress variant="determinate" value={status.progress} color={status.color} sx={{ height: 4, borderRadius: 2, width: 60, mx: 'auto' }} />
                              </Box>
                            </Box>
                          ) : (
                            <Chip label="0" color="success" size="small" sx={{ fontWeight: 900 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={status.label} color={status.color} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Record Return">
                              <IconButton size="small" onClick={() => { setSelectedMaterialLog(log); setReturnDialogOpen(true); }}
                                sx={{ color: '#2E7D32', bgcolor: 'rgba(46,125,50,0.08)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(46,125,50,0.18)' } }}>
                                <CallReceivedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Invoice">
                              <IconButton size="small"
                                sx={{ color: 'primary.main', bgcolor: 'rgba(25,118,210,0.08)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(25,118,210,0.18)' } }}>
                                <ReceiptIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => { setLogToEdit(log); setEditQty(log.quantityProduced || ''); setEditDialogOpen(true); }}
                                sx={{ color: '#ed6c02', bgcolor: 'rgba(237,108,2,0.08)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(237,108,2,0.18)' } }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => { setLogToDelete(log); setDeleteConfirmOpen(true); }}
                                sx={{ color: 'error.main', bgcolor: 'rgba(211,47,47,0.08)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(211,47,47,0.18)' } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Machine Log Evidence Dialog */}
      <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { bgcolor: '#FAFAFA', borderRadius: 4 } }}>
        {selectedLog && (
          <>
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, bgcolor: '#fff' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>Duty Evidence Report</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {selectedLog.project?.clientName || 'Walk-in'} • {selectedLog.machine?.name} • {formatDMY(new Date(selectedLog.startTime))}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedLog(null)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={{ bgcolor: 'rgba(46, 125, 50, 0.05)', border: '1px solid rgba(46, 125, 50, 0.2)', borderRadius: 3, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                      <Typography sx={{ color: '#2E7D32', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ArrowOutwardIcon fontSize="small" /> PUNCH-IN PROOF
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{formatTime(selectedLog.startTime)}</Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 3 }}>
                      {['machinePhotoUrl', 'unitPhotoUrl', 'softwarePhotoUrl'].map((key, i) => (
                        <Box key={key} sx={{ height: 120, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                          {selectedLog[key] ? <img src={selectedLog[key]} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled' }}>No Image</Box>}
                          <Chip label={i === 0 ? 'MACHINE' : i === 1 ? 'UNIT' : 'SOFTWARE'} size="small" sx={{ position: 'absolute', top: 5, left: 5, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.6rem', height: 20 }} />
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>Client</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{selectedLog.project?.clientName || 'Walk-in'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>Machine</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{selectedLog.machine?.name}</Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={{ bgcolor: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.2)', borderRadius: 3, p: 3, opacity: selectedLog.endTime ? 1 : 0.6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                      <Typography sx={{ color: '#1976D2', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CallReceivedIcon fontSize="small" /> PUNCH-OUT PROOF
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{formatTime(selectedLog.endTime)}</Typography>
                    </Box>
                    {selectedLog.endTime ? (
                      <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 3 }}>
                          {['endMachinePhotoUrl', 'endUnitPhotoUrl', 'endSoftwarePhotoUrl'].map((key, i) => (
                            <Box key={key} sx={{ height: 120, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                              {selectedLog[key] ? <img src={selectedLog[key]} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled' }}>No Image</Box>}
                              <Chip label={i === 0 ? 'MACHINE' : i === 1 ? 'UNIT' : 'SOFTWARE'} size="small" sx={{ position: 'absolute', top: 5, left: 5, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.6rem', height: 20 }} />
                            </Box>
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>Shift Run</Typography>
                          <Typography sx={{ fontWeight: 800 }}>{((new Date(selectedLog.endTime).getTime() - new Date(selectedLog.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2)} hrs</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>Quantity Produced</Typography>
                          <Typography sx={{ fontWeight: 800 }}>{selectedLog.quantityProduced || 0} PCS</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
                          <Typography sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>Remarks</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedLog.remarks || 'No remarks.'}</Typography>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ display: 'flex', height: 100, alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: '#ed6c02', fontWeight: 'bold' }}>STILL ON DUTY</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Return Material Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Record Material Return
          <IconButton onClick={() => setReturnDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedMaterialLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Box sx={{ bgcolor: 'rgba(46,125,50,0.05)', border: '1px solid rgba(46,125,50,0.2)', borderRadius: 2, p: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>{selectedMaterialLog.project?.clientName || '—'}</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Stage: {selectedMaterialLog.stage}</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Chip label={`Out: ${selectedMaterialLog.quantityProduced || 0}`} color="warning" size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={`In: ${selectedMaterialLog.returnedQty || 0}`} color="success" size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={`Pending: ${Math.max(0, (selectedMaterialLog.quantityProduced || 0) - (selectedMaterialLog.returnedQty || 0))}`} color="error" size="small" sx={{ fontWeight: 700 }} />
                </Box>
              </Box>
              <TextField label="Quantity Returned Now" type="number" fullWidth value={returnQty} onChange={(e) => setReturnQty(e.target.value)}
                slotProps={{ htmlInput: { min: 1, max: Math.max(0, (selectedMaterialLog?.quantityProduced || 0) - (selectedMaterialLog?.returnedQty || 0)) } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <TextField label="Return Date" type="date" fullWidth value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setReturnDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="success" onClick={handleReturnSubmit} disabled={!returnQty || Number(returnQty) <= 0} sx={{ fontWeight: 'bold', px: 3 }}>
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this material log? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteSubmit} sx={{ fontWeight: 'bold' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Log</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Quantity Produced" type="number" fullWidth value={editQty} onChange={(e) => setEditQty(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            {activeTab === 0 && (
              <TextField label="Remarks" fullWidth multiline rows={3} value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleEditSubmit} disabled={!editQty} sx={{ fontWeight: 'bold' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LogBook;

import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useGetInvoicesQuery, useCreateInvoiceMutation, useGetProjectsQuery } from '../store/apiSlice';

const Accounts: React.FC = () => {
  const { data: invoices, isLoading } = useGetInvoicesQuery();
  const { data: projects } = useGetProjectsQuery();
  const [createInvoice] = useCreateInvoiceMutation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ projectId: '', totalAmount: '', advancePaid: '', dueDate: '' });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      await createInvoice({
        ...formData,
        totalAmount: Number(formData.totalAmount),
        advancePaid: Number(formData.advancePaid)
      }).unwrap();
      handleClose();
      setFormData({ projectId: '', totalAmount: '', advancePaid: '', dueDate: '' });
    } catch (err) {
      console.error('Failed to create invoice', err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Accounts & Billing</Typography>
          <Typography variant="body2" color="textSecondary">Generate and track invoices for Work Orders.</Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: 8 }}>
          New Invoice
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell><strong>Invoice No.</strong></TableCell>
              <TableCell><strong>Project</strong></TableCell>
              <TableCell><strong>Total Amount</strong></TableCell>
              <TableCell><strong>Advance</strong></TableCell>
              <TableCell><strong>Balance</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
            ) : invoices?.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No invoices found.</TableCell></TableRow>
            ) : (
              invoices?.map((invoice: any) => (
                <TableRow key={invoice.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>{invoice.project?.projectId || invoice.projectId}</Typography>
                    <Typography variant="caption">{invoice.project?.name || 'Unknown Project'}</Typography>
                  </TableCell>
                  <TableCell>₹{invoice.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>₹{invoice.advancePaid.toLocaleString()}</TableCell>
                  <TableCell sx={{ color: invoice.balanceAmount > 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                    ₹{invoice.balanceAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={invoice.status.toUpperCase()} 
                      color={invoice.status === 'unpaid' ? 'error' : invoice.status === 'paid' ? 'success' : 'warning'} 
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

      {/* Add Invoice Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Generate New Invoice</DialogTitle>
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
                  <MenuItem key={p.id} value={p.id}>{p.name} ({p.projectId})</MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No projects available. Please create one first.</MenuItem>
              )}
            </TextField>
            <TextField 
              label="Total Amount (₹)" 
              type="number"
              fullWidth 
              value={formData.totalAmount} 
              onChange={(e) => setFormData({...formData, totalAmount: e.target.value})} 
            />
            <TextField 
              label="Advance Paid (₹)" 
              type="number"
              fullWidth 
              value={formData.advancePaid} 
              onChange={(e) => setFormData({...formData, advancePaid: e.target.value})} 
            />
            <TextField 
              label="Due Date" 
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth 
              value={formData.dueDate} 
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={!formData.projectId}>Save Invoice</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Accounts;

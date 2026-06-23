import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Autocomplete } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useGetProjectsQuery, useCreateProjectMutation } from '../store/apiSlice';

const CRM: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useGetProjectsQuery();
  const [createProject] = useCreateProjectMutation();
  const [open, setOpen] = useState(false);
  
  // Filter States
  const [selectedFY, setSelectedFY] = useState('FY 2026-27');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');

  const [formData, setFormData] = useState({ 
    name: '', 
    clientName: '', 
    clientContact: '', 
    enquirySource: 'Website', 
    location: '',
    requirements: '',
    status: 'enquiry' 
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      await createProject({
        ...formData,
        description: formData.requirements
      }).unwrap();
      handleClose();
      setFormData({ name: '', clientName: '', clientContact: '', enquirySource: 'Website', location: '', requirements: '', status: 'enquiry' });
    } catch (err) {
      console.error('Failed to create enquiry', err);
    }
  };

  // Status mapping
  const stageNames: Record<string, string> = {
    'enquiry': 'Enquiry (Pending)',
    'design_sharing': 'Enquiry Details', // When on step 2, show step 1 as current
    'quotation': 'Quotation Sharing', // When on step 3, show step 2
    'advance_payment': 'Quotation & Costing' // When on step 4, show step 3
  };

  // Filter logic
  let enquiries = projects?.filter((p: any) => p.status !== 'work_order' && p.status !== 'completed') || [];
  
  if (selectedMonth !== 'All') {
    enquiries = enquiries.filter((p: any) => {
      const date = new Date(p.createdAt);
      return date.toLocaleString('default', { month: 'long' }) === selectedMonth;
    });
  }

  if (selectedSource !== 'All') {
    enquiries = enquiries.filter((p: any) => p.enquirySource === selectedSource);
  }

  if (selectedStage !== 'All') {
    enquiries = enquiries.filter((p: any) => p.status === selectedStage);
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Enquiries Pipeline</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: 8 }}>
          New Enquiry
        </Button>
      </Box>

      {/* Filters Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, bgcolor: '#FFFDF5', borderRadius: 3, border: '1px solid #E8E1D5', alignItems: 'center' }}>
        <FilterListIcon sx={{ color: 'text.secondary', mr: 1 }} />
        <Typography variant="body2" fontWeight="bold" color="text.secondary">Filters:</Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Financial Year</InputLabel>
          <Select 
            value={selectedFY} 
            label="Financial Year" 
            onChange={(e) => setSelectedFY(e.target.value)}
            sx={{ bgcolor: '#FFF' }}
          >
            <MenuItem value="FY 2025-26">FY 2025-26</MenuItem>
            <MenuItem value="FY 2026-27">FY 2026-27</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Month</InputLabel>
          <Select 
            value={selectedMonth} 
            label="Month" 
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{ bgcolor: '#FFF' }}
          >
            <MenuItem value="All">All Months</MenuItem>
            <MenuItem value="January">January</MenuItem>
            <MenuItem value="February">February</MenuItem>
            <MenuItem value="March">March</MenuItem>
            <MenuItem value="April">April</MenuItem>
            <MenuItem value="May">May</MenuItem>
            <MenuItem value="June">June</MenuItem>
            <MenuItem value="July">July</MenuItem>
            <MenuItem value="August">August</MenuItem>
            <MenuItem value="September">September</MenuItem>
            <MenuItem value="October">October</MenuItem>
            <MenuItem value="November">November</MenuItem>
            <MenuItem value="December">December</MenuItem>
          </Select>
        </FormControl>

        <Autocomplete
          size="small"
          options={['All', 'WhatsApp', 'Website', 'Call', 'Architect', 'Interior Designer', 'Reference']}
          value={selectedSource}
          onChange={(_e, newValue) => setSelectedSource(newValue || 'All')}
          renderInput={(params) => <TextField {...params} label="Source" sx={{ width: 180, bgcolor: '#FFF' }} />}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Current Stage</InputLabel>
          <Select 
            value={selectedStage} 
            label="Current Stage" 
            onChange={(e) => setSelectedStage(e.target.value)}
            sx={{ bgcolor: '#FFF' }}
          >
            <MenuItem value="All">All Stages</MenuItem>
            <MenuItem value="enquiry">Enquiry (Pending)</MenuItem>
            <MenuItem value="design_sharing">Enquiry Details</MenuItem>
            <MenuItem value="quotation">Quotation Sharing</MenuItem>
            <MenuItem value="advance_payment">Quotation & Costing</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#F9F9F9' }}>
            <TableRow>
              <TableCell><strong>Enquiry ID / Project</strong></TableCell>
              <TableCell><strong>Client Name</strong></TableCell>
              <TableCell><strong>Contact</strong></TableCell>
              <TableCell><strong>Source</strong></TableCell>
              <TableCell><strong>Current Stage</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
            ) : enquiries?.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No active enquiries in pipeline.</TableCell></TableRow>
            ) : (
              enquiries?.map((enq: any) => (
                <TableRow key={enq.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/crm/${enq.id}`)}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>{enq.projectId}</Typography>
                    <Typography variant="caption">{enq.name}</Typography>
                  </TableCell>
                  <TableCell>{enq.clientName}</TableCell>
                  <TableCell>{enq.clientContact}</TableCell>
                  <TableCell>{enq.enquirySource}</TableCell>
                  <TableCell>
                    <Chip 
                      label={stageNames[enq.status] || enq.status.replace('_', ' ').toUpperCase()} 
                      sx={{ 
                        bgcolor: enq.status === 'advance_payment' ? '#E8F5E9' : '#FFF4E5',
                        color: enq.status === 'advance_payment' ? '#2E7D32' : '#B38B36',
                        fontWeight: 'bold', border: '1px solid',
                        borderColor: enq.status === 'advance_payment' ? '#C8E6C9' : '#FFE0B2'
                      }}
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{new Date(enq.createdAt).toLocaleDateString('en-GB')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Enquiry Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create New Enquiry</DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              label="Project / Enquiry Title" 
              fullWidth 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="Client Name" 
                fullWidth 
                value={formData.clientName} 
                onChange={(e) => setFormData({...formData, clientName: e.target.value})} 
              />
              <TextField 
                label="Contact Number" 
                fullWidth 
                value={formData.clientContact} 
                onChange={(e) => setFormData({...formData, clientContact: e.target.value})} 
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Autocomplete
                freeSolo
                options={['WhatsApp', 'Website', 'Call', 'Architect', 'Interior Designer', 'Reference']}
                value={formData.enquirySource}
                onChange={(_e, newValue) => setFormData({...formData, enquirySource: newValue || ''})}
                onInputChange={(_e, newInputValue) => setFormData({...formData, enquirySource: newInputValue})}
                renderInput={(params) => <TextField {...params} label="Source (Search or Add New)" fullWidth />}
                sx={{ width: '100%' }}
              />
              <TextField 
                label="Location" 
                fullWidth 
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})} 
              />
            </Box>
            <TextField 
              label="Requirements / Scope of Work" 
              fullWidth 
              multiline
              rows={3}
              value={formData.requirements} 
              onChange={(e) => setFormData({...formData, requirements: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Save Enquiry</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CRM;

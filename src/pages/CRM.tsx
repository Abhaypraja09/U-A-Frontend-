import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Autocomplete } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import CampaignIcon from '@mui/icons-material/Campaign';
import LayersIcon from '@mui/icons-material/Layers';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { IconButton } from '@mui/material';
import { useGetProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation, useUploadFilesMutation } from '../store/apiSlice';

const CRM: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useGetProjectsQuery();
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const fileName = `Captured_Client_Photo_${new Date().getTime()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            stopCamera();
            
            const uploadData = new FormData();
            uploadData.append('files', file);
            try {
              const res = await uploadFiles(uploadData).unwrap();
              if (res.success && res.urls.length > 0) {
                setFormData({ ...formData, customerPhoto: res.urls[0] });
              }
            } catch (err) {
              console.error('Failed to upload client photo', err);
            }
          }
        }, 'image/jpeg');
      }
    }
  };
  
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
    status: 'enquiry',
    createdAt: new Date().toISOString().split('T')[0],
    customerPhoto: ''
  });

  const handleOpen = () => {
    setEditingId(null);
    setFormData({ name: '', clientName: '', clientContact: '', enquirySource: 'Website', location: '', requirements: '', status: 'enquiry', createdAt: new Date().toISOString().split('T')[0], customerPhoto: '' });
    setOpen(true);
  };
  const handleOpenEdit = (enq: any) => {
    setEditingId(enq.id);
    setFormData({
      name: enq.name,
      clientName: enq.clientName,
      clientContact: enq.clientContact,
      enquirySource: enq.enquirySource,
      location: enq.location || '',
      requirements: enq.description || '',
      status: enq.status,
      createdAt: new Date(enq.createdAt).toISOString().split('T')[0],
      customerPhoto: enq.customerPhoto || ''
    });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateProject({ id: editingId, data: { ...formData, description: formData.requirements, createdAt: new Date(formData.createdAt).toISOString() } }).unwrap();
      } else {
        await createProject({ ...formData, description: formData.requirements, createdAt: new Date(formData.createdAt).toISOString() }).unwrap();
      }
      handleClose();
      setFormData({ name: '', clientName: '', clientContact: '', enquirySource: 'Website', location: '', requirements: '', status: 'enquiry', createdAt: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error('Failed to save enquiry', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this project? This will permanently delete all related documents and logs.")) {
      try {
        await deleteProject(id).unwrap();
      } catch (err) {
        console.error('Failed to delete project', err);
      }
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
  let enquiries = projects?.filter((p: any) => !['material_planning', 'production', 'work_order', 'completed'].includes(p.status)) || [];
  
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
        
        {/* Source Filter */}
        <Select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value as string)}
          displayEmpty
          IconComponent={KeyboardArrowDownIcon}
          sx={{
            bgcolor: '#FFF',
            borderRadius: 3,
            border: '1px solid #E8E1D5',
            minWidth: 200,
            '& .MuiSelect-select': { display: 'flex', alignItems: 'center', p: 1, pr: 4 },
            '& fieldset': { border: 'none' },
          }}
          renderValue={(value) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#FFF4E5', borderRadius: 2, display: 'flex', color: '#B38B36' }}>
                <CampaignIcon fontSize="small" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem', textTransform: 'uppercase', lineHeight: 1 }}>Source Filter</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2, mt: 0.5 }}>
                  {value === 'All' ? 'All Sources' : value as string}
                </Typography>
              </Box>
            </Box>
          )}
        >
          {['All', 'WhatsApp', 'Website', 'Call', 'Architect', 'Interior Designer', 'Reference'].map((src) => (
            <MenuItem key={src} value={src}>{src === 'All' ? 'All Sources' : src}</MenuItem>
          ))}
        </Select>

        {/* Current Stage Filter */}
        <Select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value as string)}
          displayEmpty
          IconComponent={KeyboardArrowDownIcon}
          sx={{
            bgcolor: '#FFF',
            borderRadius: 3,
            border: '1px solid #E8E1D5',
            minWidth: 200,
            '& .MuiSelect-select': { display: 'flex', alignItems: 'center', p: 1, pr: 4 },
            '& fieldset': { border: 'none' },
          }}
          renderValue={(value) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#FFF4E5', borderRadius: 2, display: 'flex', color: '#B38B36' }}>
                <LayersIcon fontSize="small" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem', textTransform: 'uppercase', lineHeight: 1 }}>Category Filter</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2, mt: 0.5 }}>
                  {value === 'All' ? 'All Stages' : stageNames[value as string] || (value as string)}
                </Typography>
              </Box>
            </Box>
          )}
        >
          <MenuItem value="All">All Stages</MenuItem>
          <MenuItem value="enquiry">Enquiry (Pending)</MenuItem>
          <MenuItem value="design_sharing">Enquiry Details</MenuItem>
          <MenuItem value="quotation">Quotation Sharing</MenuItem>
          <MenuItem value="advance_payment">Quotation & Costing</MenuItem>
        </Select>

        <Box sx={{ flexGrow: 1 }} />

        {/* Date Filters Right Aligned */}
        <Select 
          size="small"
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value as string)}
          sx={{ bgcolor: '#FFF', borderRadius: 2, fontWeight: 'bold', minWidth: 120, '& fieldset': { borderColor: '#E8E1D5' } }}
          IconComponent={KeyboardArrowDownIcon}
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

        <Select 
          size="small"
          value={selectedFY} 
          onChange={(e) => setSelectedFY(e.target.value as string)}
          sx={{ bgcolor: '#FFF', borderRadius: 2, fontWeight: 'bold', minWidth: 130, '& fieldset': { borderColor: '#E8E1D5' } }}
          IconComponent={KeyboardArrowDownIcon}
          renderValue={(value) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>FY</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{(value as string).replace('FY ', '')}</Typography>
            </Box>
          )}
        >
          <MenuItem value="FY 2025-26">FY 2025-26</MenuItem>
          <MenuItem value="FY 2026-27">FY 2026-27</MenuItem>
        </Select>
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
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} align="center">Loading...</TableCell></TableRow>
            ) : enquiries?.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No active enquiries in pipeline.</TableCell></TableRow>
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
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <IconButton color="primary" onClick={() => handleOpenEdit(enq)} size="small" sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(enq.id)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Enquiry Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editingId ? 'Edit Enquiry' : 'Create New Enquiry'}</DialogTitle>
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
            <TextField 
              label="Date" 
              type="date"
              fullWidth 
              value={formData.createdAt} 
              onChange={(e) => setFormData({...formData, createdAt: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Client Photo</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {formData.customerPhoto ? (
                  <Box sx={{ position: 'relative', width: 80, height: 80, border: '1px solid #CCC', borderRadius: 2, overflow: 'hidden' }}>
                    <img src={formData.customerPhoto} alt="Client Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton 
                      size="small" 
                      onClick={() => setFormData({ ...formData, customerPhoto: '' })}
                      sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255, 255, 255, 0.7)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } }}
                    >
                      <CloseIcon fontSize="small" sx={{ color: 'error.main' }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={isUploading}
                      sx={{ height: 80, width: 80, borderStyle: 'dashed', borderColor: '#B38B36', bgcolor: '#FFFDF5', '&:hover': { bgcolor: '#FFF4E5' }, borderRadius: 2, display: 'flex', flexDirection: 'column', fontSize: '0.75rem', color: '#B38B36', justifyContent: 'center', alignItems: 'center', textTransform: 'none', fontWeight: 'bold' }}
                    >
                      {isUploading ? 'Uploading...' : '+ Upload'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            const uploadData = new FormData();
                            uploadData.append('files', file);
                            try {
                              const res = await uploadFiles(uploadData).unwrap();
                              if (res.success && res.urls.length > 0) {
                                setFormData({ ...formData, customerPhoto: res.urls[0] });
                              }
                            } catch (err) {
                              console.error('Failed to upload client photo', err);
                            }
                          }
                        }}
                      />
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={isUploading}
                      onClick={startCamera}
                      sx={{ height: 80, width: 80, borderStyle: 'dashed', borderColor: '#B38B36', bgcolor: '#FFFDF5', '&:hover': { bgcolor: '#FFF4E5' }, borderRadius: 2, display: 'flex', flexDirection: 'column', fontSize: '0.75rem', color: '#B38B36', justifyContent: 'center', alignItems: 'center', textTransform: 'none', fontWeight: 'bold' }}
                    >
                      <Typography sx={{ fontSize: '1.25rem', mb: 0.5 }}>📷</Typography>
                      Camera
                    </Button>
                  </Box>
                )}
                {formData.customerPhoto && (
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>Photo Uploaded Successfully</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Save Enquiry</Button>
        </DialogActions>
      </Dialog>

      {/* CAMERA CAPTURE DIALOG */}
      <Dialog 
        open={isCameraOpen} 
        onClose={stopCamera} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1C29', color: '#FFF', borderRadius: 4, border: '1px solid #333' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          Take Photo
          <IconButton onClick={stopCamera} sx={{ color: '#FFF' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          <Box sx={{ 
            width: '100%', 
            maxWidth: 600, 
            bgcolor: '#000', 
            borderRadius: 4, 
            overflow: 'hidden',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            mb: 3, position: 'relative'
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'cover' }} 
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<CameraAltIcon />} 
            onClick={capturePhoto}
            sx={{ 
              bgcolor: '#10B981', color: '#FFF', 
              fontWeight: 'bold', px: 6, py: 1.5, borderRadius: 2,
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            Capture Photo
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CRM;

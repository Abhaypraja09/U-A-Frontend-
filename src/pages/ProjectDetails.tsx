import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Stepper, Step, StepLabel, TextField, Divider, Chip, Dialog, DialogTitle, DialogContent, IconButton, Avatar, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetProjectByIdQuery, useUpdateProjectMutation, useCreateQuotationMutation, useCreateInvoiceMutation, useUploadFilesMutation, useGetDrawingsQuery, useAddDrawingMutation, useApproveDrawingMutation } from '../store/apiSlice';
import { generateReceiptPDF, generateWorkOrderPDF } from '../utils/pdfGenerator';

const steps = ['Enquiry Details', 'Quotation Sharing', 'Quotation & Costing', 'Advance Payment', 'Shop Drawing & Approval'];

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, refetch } = useGetProjectByIdQuery(id as string);
  const { data: drawings, refetch: refetchDrawings } = useGetDrawingsQuery(id as string);
  const [updateProject] = useUpdateProjectMutation();
  const [createQuotation] = useCreateQuotationMutation();
  const [createInvoice] = useCreateInvoiceMutation();
  const [uploadFiles] = useUploadFilesMutation();
  const [addDrawing] = useAddDrawingMutation();
  const [approveDrawing] = useApproveDrawingMutation();

  const [activeStep, setActiveStep] = useState(0);

  // Edit Dialog States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    clientContact: '',
    enquirySource: '',
    description: ''
  });

  // Form states
  const [designFiles, setDesignFiles] = useState<{name: string, url: string, file?: File | Blob}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  
  type Product = {
    id: string;
    category: string;
    unit: string;
    lengthFt: number;
    lengthIn: number;
    widthFt: number;
    widthIn: number;
    qty: number;
    rate: number;
    amount: number;
  };
  const [products, setProducts] = useState<Product[]>([]);

  const [quoteDetails, setQuoteDetails] = useState(() => {
    const saved = localStorage.getItem(`quoteDraft_${id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      delete parsed.marginPercentage;
      return parsed;
    }
    return {
      materialCost: 0, cncCost: 0, handCarvingCost: 0, inlayCost: 0, polishingCost: 0, packingCost: 0, transportCost: 0, installationCost: 0
    };
  });

  React.useEffect(() => {
    localStorage.setItem(`quoteDraft_${id}`, JSON.stringify(quoteDetails));
  }, [quoteDetails, id]);

  const [advancePayment, setAdvancePayment] = useState(0);

  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const hasInitializedStep = useRef(false);

  const getStepIndex = (status: string) => {
    if (status === 'enquiry') return 0;
    if (status === 'design_sharing') return 1;
    if (status === 'quotation') return 2;
    if (status === 'advance_payment') return 3;
    if (status === 'shop_drawing') return 4;
    if (status === 'work_order' || status === 'completed') return 5;
    return 0;
  };

  React.useEffect(() => {
    if (project) {
      if (!hasInitializedStep.current) {
        setActiveStep(getStepIndex(project.status));
        hasInitializedStep.current = true;
      }

      if (project.designFiles && project.designFiles.length > 0) {
        setDesignFiles(project.designFiles.map((url: string, i: number) => ({ name: `Design_${i+1}`, url })));
      }
      if (project.customerPhoto) {
        setCustomerPhoto(project.customerPhoto);
      }
    }
  }, [project]);

  // Clean up camera stream when dialog closes or component unmounts
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
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `Captured_Photo_${new Date().getTime()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            setDesignFiles(prev => [...prev, { name: fileName, url: URL.createObjectURL(file), file }]);
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };



  const calculateAmount = (p: Product) => {
    let amount = 0;
    if (p.unit === 'Sq. Ft') {
      const lengthDec = p.lengthFt + p.lengthIn / 12;
      const widthDec = p.widthFt + p.widthIn / 12;
      amount = lengthDec * widthDec * p.qty * p.rate;
    } else if (p.unit === 'Running Ft') {
      const lengthDec = p.lengthFt + p.lengthIn / 12;
      amount = lengthDec * p.qty * p.rate;
    } else {
      amount = p.qty * p.rate;
    }
    return Math.round(amount);
  };

  const handleAddProduct = () => {
    setProducts([...products, {
      id: Date.now().toString(),
      category: 'Stone Name Plate',
      unit: 'Sq. Ft',
      lengthFt: 0, lengthIn: 0,
      widthFt: 0, widthIn: 0,
      qty: 1, rate: 0, amount: 0
    }]);
  };

  const handleUpdateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        updated.amount = calculateAmount(updated);
        return updated;
      }
      return p;
    }));
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleNextStage = async (newStatus: string) => {
    try {
      await updateProject({ id: id as string, data: { status: newStatus } }).unwrap();
      setActiveStep(getStepIndex(newStatus));
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFreezeDesign = async () => {
    try {
      setIsUploading(true);
      const filesToUpload = designFiles.filter(df => df.file).map(df => df.file as File | Blob);
      
      let allUrls = designFiles.filter(df => !df.file).map(df => df.url);

      if (filesToUpload.length > 0) {
        const formData = new FormData();
        filesToUpload.forEach(file => formData.append('files', file));

        const uploadResponse = await uploadFiles(formData).unwrap();
        if (uploadResponse.success) {
          allUrls = [...allUrls, ...uploadResponse.urls];
        }
      }

      await updateProject({ id: id as string, data: { status: 'quotation', designFiles: allUrls } }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to proceed to costing", err);
      alert("Error saving data before proceeding.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateQuotation = async () => {
    try {
      await createQuotation({ projectId: id, products, ...quoteDetails }).unwrap();
      await handleNextStage('advance_payment');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvancePayment = async () => {
    try {
      await createInvoice({
        projectId: id,
        totalAmount: advancePayment,
        advancePaid: advancePayment
      }).unwrap();
      
      await updateProject({ id: id as string, data: { status: 'shop_drawing' } }).unwrap();
      setActiveStep(4);
      refetch();
      alert("Payment recorded! Proceeding to Shop Drawings.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadReceipt = () => {
    generateReceiptPDF(project, advancePayment);
  };

  const handleDownloadWorkOrder = () => {
    generateWorkOrderPDF(project, advancePayment);
  };

  if (isLoading) return <Typography sx={{ p: 4 }}>Loading Project Details...</Typography>;
  if (!project) return <Typography sx={{ p: 4 }}>Project not found.</Typography>;

  return (
    <Box sx={{ maxWidth: 1536, mx: 'auto', px: { xs: 2, md: 4 } }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 3, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
        disableRipple
      >
        Back to Pipeline
      </Button>
      
      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
        {/* LEFT MAIN COLUMN */}
        <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
          {/* HEADER CARD */}
          <Paper elevation={0} sx={{ 
        p: 4, mb: 4, 
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF5 100%)',
        border: '1px solid', borderColor: '#E8E1D5', 
        borderRadius: 4,
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.03)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: '#F7F3EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B38B36' }}>
              <FolderSpecialIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ mb: 0.5 }}>{project.name}</Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {project.projectId} • Client: {project.clientName}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={project.status.toUpperCase().replace('_', ' ')} 
            sx={{ 
              fontWeight: 700, 
              px: 1, 
              bgcolor: project.status === 'work_order' ? '#E8F5E9' : '#FFF4E5',
              color: project.status === 'work_order' ? '#2E7D32' : '#B38B36',
              border: '1px solid',
              borderColor: project.status === 'work_order' ? '#C8E6C9' : '#FFE0B2'
            }} 
          />
        </Box>
      </Paper>

      {/* STEPPER */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepIcon-root': { color: activeStep >= index ? '#B38B36 !important' : '#E0E0E0' } }}>
                <Typography sx={{ fontWeight: activeStep === index ? 700 : 500, color: activeStep === index ? 'text.primary' : 'text.secondary' }}>
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

        {/* CONTENT AREA */}
        <Box sx={{ minHeight: 400 }}>
          
          {/* STEP 0: ENQUIRY DETAILS */}
          {activeStep === 0 && (
            <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">Enquiry Details</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>Review the initial requirements and client information.</Typography>
                </Box>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => {
                  setEditFormData({
                    clientContact: project.clientContact || '',
                    enquirySource: project.enquirySource || '',
                    description: project.description || ''
                  });
                  setIsEditDialogOpen(true);
                }}>Edit Details</Button>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 4, mb: 4 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Enquiry ID / Project</Typography>
                  <Typography variant="body1" fontWeight={500} mt={0.5} color="primary.main">{project.projectId}</Typography>
                  <Typography variant="body2">{project.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Client Name</Typography>
                  <Typography variant="body1" fontWeight={500} mt={0.5}>{project.clientName || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Contact Number</Typography>
                  <Typography variant="body1" fontWeight={500} mt={0.5}>{project.clientContact || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Source</Typography>
                  <Typography variant="body1" fontWeight={500} mt={0.5}>{project.enquirySource || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Date</Typography>
                  <Typography variant="body1" fontWeight={500} mt={0.5}>{new Date(project.createdAt).toLocaleDateString('en-GB')}</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              <Box sx={{ mb: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Requirements / Scope of Work</Typography>
                <Typography variant="body1" mt={1} sx={{ p: 2, bgcolor: '#F9F9F9', borderRadius: 2, border: '1px solid #EEEEEE', minHeight: 100 }}>
                  {project.description || 'No specific requirements listed.'}
                </Typography>
              </Box>

              <Divider sx={{ my: 4 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="large" onClick={() => handleNextStage('design_sharing')} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                  Proceed to Quotation Sharing
                </Button>
              </Box>
            </Paper>
          )}

          {/* STEP 1: QUOTATION SHARING (Previously Design Finalization) */}
          {activeStep === 1 && (
            <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">Quotation Sharing & Design</Typography>
                  <Typography variant="body1" color="text.secondary" mt={1}>Upload CAD drawings, material selections, and 3D renders from your device.</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</Typography>
                </Box>
                
                {/* Custom Upload & Camera Buttons Aligned Right */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box 
                    component="label"
                    sx={{ 
                      width: 120, height: 120, 
                      border: '2px dashed #B38B36', borderRadius: 3, 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', bgcolor: '#FFFDF5', '&:hover': { bgcolor: '#FFF4E5' }, transition: '0.2s'
                    }}
                  >
                    <Typography variant="h4" color="#B38B36" sx={{ mb: 1 }}>+</Typography>
                    <Typography variant="body2" color="#B38B36" fontWeight="bold">Upload</Typography>
                    <input 
                      type="file" 
                      hidden 
                      multiple 
                      accept="image/*,.pdf,.dwg" 
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files).map(file => ({
                            name: file.name,
                            url: URL.createObjectURL(file),
                            file
                          }));
                          setDesignFiles(prev => [...prev, ...newFiles]);
                        }
                      }} 
                    />
                  </Box>

                  <Box 
                    onClick={startCamera}
                    sx={{ 
                      width: 120, height: 120, 
                      border: '2px dashed #B38B36', borderRadius: 3, 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', bgcolor: '#FFFDF5', '&:hover': { bgcolor: '#FFF4E5' }, transition: '0.2s'
                    }}
                  >
                    <Typography variant="h4" color="#B38B36" sx={{ mb: 1 }}>📷</Typography>
                    <Typography variant="body2" color="#B38B36" fontWeight="bold">Camera</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Selected Files Thumbnail Preview - Aligned horizontally below text, not spanning full width unnecessarily */}
              {designFiles.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary" mb={2}>Selected Files:</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {designFiles.map((file, i) => (
                      <Box key={i} sx={{ position: 'relative', width: 80, height: 80 }}>
                        <img 
                          src={file.url} 
                          alt={file.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #CCC' }} 
                        />
                        <IconButton 
                          size="small" 
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#FF3B30', color: '#FFF', width: 24, height: 24, '&:hover': { bgcolor: '#D32F2F' } }} 
                          onClick={() => setDesignFiles(designFiles.filter((_, idx) => idx !== i))}
                        >
                          <CloseIcon sx={{ fontSize: 16 }}/>
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" size="large" onClick={() => handleNextStage('enquiry')} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                  Back
                </Button>
                <Button variant="contained" size="large" onClick={handleFreezeDesign} disabled={isUploading} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                  {isUploading ? 'Saving & Proceeding...' : 'Proceed to Costing'}
                </Button>
              </Box>
            </Paper>
          )}

          {/* STEP 2: QUOTATION & COSTING */}
          {activeStep === 2 && (
            <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
              <Typography variant="h5" fontWeight="bold" mb={4} color="text.primary">Quotation & Costing Builder</Typography>
              
              <Box sx={{ mb: 4, p: 3, border: '1px solid #E0E0E0', borderRadius: 3, bgcolor: '#FAFAFA' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">Product Estimation</Typography>
                  <Button variant="contained" onClick={handleAddProduct} sx={{ borderRadius: 2 }}>+ Add Product</Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#EEEEEE' }}>
                      <TableRow>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell><strong>Unit</strong></TableCell>
                        <TableCell><strong>L (Ft, In)</strong></TableCell>
                        <TableCell><strong>W (Ft, In)</strong></TableCell>
                        <TableCell><strong>Qty</strong></TableCell>
                        <TableCell><strong>Rate</strong></TableCell>
                        <TableCell><strong>Amount</strong></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Select size="small" value={p.category} onChange={e => handleUpdateProduct(p.id, 'category', e.target.value)} sx={{ width: 160 }}>
                              {['Stone Name Plate', 'God Panel', 'Stone Table Top', 'Antique Panel', 'Stone Basin', 'Wall Cladding', 'Modern Art', 'Semiprecious Slab'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select size="small" value={p.unit} onChange={e => handleUpdateProduct(p.id, 'unit', e.target.value)} sx={{ width: 120 }}>
                              <MenuItem value="Sq. Ft">Sq. Ft</MenuItem>
                              <MenuItem value="Running Ft">Running Ft</MenuItem>
                              <MenuItem value="Pieces">Pieces</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell sx={{ display: 'flex', gap: 1 }}>
                            <TextField size="small" type="number" sx={{ width: 60 }} label="Ft" value={p.lengthFt === 0 ? '' : p.lengthFt} onChange={e => handleUpdateProduct(p.id, 'lengthFt', Number(e.target.value))} disabled={p.unit === 'Pieces'} />
                            <TextField size="small" type="number" sx={{ width: 60 }} label="In" value={p.lengthIn === 0 ? '' : p.lengthIn} onChange={e => handleUpdateProduct(p.id, 'lengthIn', Number(e.target.value))} disabled={p.unit === 'Pieces'} />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField size="small" type="number" sx={{ width: 60 }} label="Ft" value={p.widthFt === 0 ? '' : p.widthFt} onChange={e => handleUpdateProduct(p.id, 'widthFt', Number(e.target.value))} disabled={p.unit === 'Pieces' || p.unit === 'Running Ft'} />
                              <TextField size="small" type="number" sx={{ width: 60 }} label="In" value={p.widthIn === 0 ? '' : p.widthIn} onChange={e => handleUpdateProduct(p.id, 'widthIn', Number(e.target.value))} disabled={p.unit === 'Pieces' || p.unit === 'Running Ft'} />
                            </Box>
                          </TableCell>
                          <TableCell><TextField size="small" type="number" sx={{ width: 70 }} value={p.qty === 0 ? '' : p.qty} onChange={e => handleUpdateProduct(p.id, 'qty', Number(e.target.value))} /></TableCell>
                          <TableCell><TextField size="small" type="number" sx={{ width: 100 }} value={p.rate === 0 ? '' : p.rate} onChange={e => handleUpdateProduct(p.id, 'rate', Number(e.target.value))} /></TableCell>
                          <TableCell><Typography fontWeight="bold">₹{p.amount.toLocaleString('en-IN')}</Typography></TableCell>
                          <TableCell><IconButton color="error" onClick={() => handleRemoveProduct(p.id)}><DeleteIcon /></IconButton></TableCell>
                        </TableRow>
                      ))}
                      {products.length === 0 && (
                        <TableRow><TableCell colSpan={8} align="center">No products added. Click "+ Add Product".</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Total Products Amount: ₹{products.reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-IN')}</Typography>
                </Box>
              </Box>

              <Typography variant="h6" fontWeight="bold" mb={2}>Additional Costs</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
                {Object.keys(quoteDetails).map((key) => (
                  <TextField 
                    key={key}
                    fullWidth 
                    type="number"
                    label={key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())} 
                    value={(quoteDetails as any)[key] === 0 ? '' : (quoteDetails as any)[key]}
                    onChange={(e) => setQuoteDetails({ ...quoteDetails, [key]: Number(e.target.value) })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                ))}
              </Box>

              <Box sx={{ 
                p: 3, mb: 4, 
                background: 'linear-gradient(90deg, #2A2D3E 0%, #1A1C29 100%)', 
                borderRadius: 3, 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
              }}>
                <Typography variant="h6" sx={{ color: '#E8E1D5', fontWeight: 500 }}>Estimated Total Quote</Typography>
                <Typography variant="h4" sx={{ color: '#E5C07B', fontWeight: 'bold' }}>
                  ₹{
                    (products.reduce((acc, p) => acc + p.amount, 0) + quoteDetails.materialCost + quoteDetails.cncCost + quoteDetails.handCarvingCost + quoteDetails.inlayCost + quoteDetails.polishingCost + quoteDetails.packingCost + quoteDetails.transportCost + quoteDetails.installationCost).toLocaleString('en-IN')
                  }
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" size="large" onClick={() => handleNextStage('design_sharing')} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                  Back
                </Button>
                <Button variant="contained" size="large" onClick={handleCreateQuotation} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                  Save & Generate Quotation
                </Button>
              </Box>
            </Paper>
          )}

          {/* STEP 3: ADVANCE PAYMENT */}
          {activeStep === 3 && (
            <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
              <Typography variant="h5" fontWeight="bold" mb={2} color="text.primary">Advance Payment</Typography>
              <Typography variant="body1" color="text.secondary" mb={4}>Client has approved the quotation. Enter the advance payment received to freeze this project and convert it into an Active Work Order for the factory.</Typography>
              
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 4 }}>
                <TextField 
                  type="number"
                  label="Advance Payment Received (₹)" 
                  value={advancePayment === 0 ? '' : advancePayment}
                  onChange={(e) => setAdvancePayment(Number(e.target.value))}
                  sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                {advancePayment > 0 && (
                  <Button variant="outlined" color="primary" onClick={handleDownloadReceipt} sx={{ height: 56, borderRadius: 2 }}>
                    Download Receipt PDF
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" size="large" onClick={() => handleNextStage('quotation')} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                  Back
                </Button>
                <Button variant="contained" color="success" size="large" onClick={handleAdvancePayment} startIcon={<CheckCircleIcon />} sx={{ px: 4, py: 1.5, borderRadius: 2, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
                  Confirm & Proceed to Shop Drawings
                </Button>
              </Box>
            </Paper>
          )}

          {/* STEP 4: SHOP DRAWING & APPROVAL */}
          {activeStep === 4 && (
            <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">Shop Drawing & Design Approval</Typography>
                  <Typography variant="body1" color="text.secondary" mt={1}>Upload final shop drawings, production layouts, and 3D renders for client approval.</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</Typography>
                </Box>
                
                {/* Custom Upload & Camera Buttons Aligned Right */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box 
                    component="label"
                    sx={{ 
                      width: 120, height: 120, 
                      border: '2px dashed #B38B36', borderRadius: 3, 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: isUploading ? 'not-allowed' : 'pointer', bgcolor: '#FFFDF5', '&:hover': { bgcolor: isUploading ? '#FFFDF5' : '#FFF4E5' }, transition: '0.2s',
                      opacity: isUploading ? 0.6 : 1
                    }}
                  >
                    <Typography variant="h4" color="#B38B36" sx={{ mb: 1 }}>+</Typography>
                    <Typography variant="body2" color="#B38B36" fontWeight="bold">{isUploading ? 'Uploading...' : 'Upload'}</Typography>
                    <input 
                      type="file" 
                      hidden 
                      multiple 
                      disabled={isUploading}
                      accept="image/*,.pdf,.dwg" 
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setIsUploading(true);
                          const formData = new FormData();
                          Array.from(e.target.files).forEach(f => formData.append('files', f));
                          try {
                            const res = await uploadFiles(formData).unwrap();
                            for (const url of res.urls) {
                               await addDrawing({ projectId: id, title: 'Shop Drawing', type: 'Shop Drawing', fileUrl: url }).unwrap();
                            }
                            alert('Drawings uploaded successfully!');
                          } catch (err) {
                            console.error(err);
                            alert('Upload failed');
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }} 
                    />
                  </Box>

                  {/* Camera just opening the standard file input with capture="environment" for mobile, or we could use the same startCamera logic. For now, we will just use the same file input but with capture. */}
                  <Box 
                    component="label"
                    sx={{ 
                      width: 120, height: 120, 
                      border: '2px dashed #B38B36', borderRadius: 3, 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: isUploading ? 'not-allowed' : 'pointer', bgcolor: '#FFFDF5', '&:hover': { bgcolor: isUploading ? '#FFFDF5' : '#FFF4E5' }, transition: '0.2s',
                      opacity: isUploading ? 0.6 : 1
                    }}
                  >
                    <Typography variant="h4" color="#B38B36" sx={{ mb: 1 }}>📷</Typography>
                    <Typography variant="body2" color="#B38B36" fontWeight="bold">Camera</Typography>
                    <input 
                      type="file" 
                      hidden 
                      capture="environment"
                      accept="image/*" 
                      disabled={isUploading}
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setIsUploading(true);
                          const formData = new FormData();
                          Array.from(e.target.files).forEach(f => formData.append('files', f));
                          try {
                            const res = await uploadFiles(formData).unwrap();
                            for (const url of res.urls) {
                               await addDrawing({ projectId: id, title: 'Shop Drawing Photo', type: 'Shop Drawing', fileUrl: url }).unwrap();
                            }
                            alert('Photo uploaded successfully!');
                          } catch (err) {
                            console.error(err);
                            alert('Upload failed');
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }} 
                    />
                  </Box>
                </Box>
              </Box>

              {drawings && drawings.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" mb={2}>Uploaded Drawings</Typography>
                  {drawings.map((drawing: any) => (
                    <Box key={drawing.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #EEE', borderRadius: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{drawing.title} (v{drawing.version})</Typography>
                        <Typography variant="body2" color="text.secondary">Status: <strong>{drawing.status}</strong> | {new Date(drawing.createdAt).toLocaleDateString()}</Typography>
                        <a href={drawing.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#1976d2', textDecoration: 'none', fontSize: 14 }}>View File</a>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" color="success" size="small" onClick={() => approveDrawing({ id: drawing.id, body: { status: 'Approved', approvedBy: project.clientName, notes: '' } })}>Approve</Button>
                        <Button variant="outlined" color="error" size="small" onClick={() => approveDrawing({ id: drawing.id, body: { status: 'Rejected', approvedBy: project.clientName, notes: 'Requires changes' } })}>Reject</Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" size="large" onClick={() => handleNextStage('advance_payment')} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                  Back
                </Button>
                <Button variant="contained" color="success" size="large" onClick={async () => {
                  await updateProject({ id: id as string, data: { status: 'work_order' } }).unwrap();
                  setActiveStep(5);
                  refetch();
                }} sx={{ px: 4, py: 1.5, borderRadius: 2, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
                  Finalize Design & Start Factory Order
                </Button>
              </Box>
            </Paper>
          )}

          {/* STEP 5: WORK ORDER ACTIVE */}
          {activeStep >= 5 && (
            <Paper elevation={0} sx={{ 
              p: 6, textAlign: 'center', 
              border: '1px solid', borderColor: '#C8E6C9', 
              borderRadius: 4, bgcolor: '#F4FBF5' 
            }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main" mb={2}>Project Pipeline Complete!</Typography>
              <Typography variant="body1" color="text.secondary" mb={4} sx={{ maxWidth: 500, mx: 'auto' }}>
                This project has successfully completed the enquiry pipeline and is now an <strong>Active Work Order</strong> in the factory.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" color="primary" size="large" onClick={handleDownloadWorkOrder} sx={{ borderRadius: 2, px: 4 }}>
                  Download Work Order PDF
                </Button>
                <Button variant="contained" color="success" size="large" onClick={() => navigate('/projects')} sx={{ borderRadius: 2, px: 4 }}>
                  Go to Active Work Orders
                </Button>
              </Box>
            </Paper>
          )}

        </Box>
        </Box> {/* End of LEFT MAIN COLUMN */}

        {/* RIGHT SIDEBAR TIMELINE */}
        <Box sx={{ width: { xs: '100%', md: 350 }, flexShrink: 0 }}>
          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, position: 'sticky', top: 24, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
            <Typography variant="h6" fontWeight="bold" mb={3} color="text.primary">Activity Log</Typography>
            
            <Stepper orientation="vertical" activeStep={activeStep} sx={{ '& .MuiStepConnector-line': { minHeight: 40 } }}>
              {steps.map((label, index) => {
                const dbStep = project ? getStepIndex(project.status) : 0;
                const isCompleted = dbStep > index;
                const dateToShow = index === 0 ? project?.createdAt : project?.updatedAt;
                const dateStr = dateToShow ? new Date(dateToShow).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';

                return (
                <Step key={label}>
                  <StepLabel 
                    sx={{ cursor: dbStep >= index ? 'pointer' : 'default', '& .MuiStepIcon-root': { color: activeStep > index || dbStep > index ? '#4CAF50 !important' : activeStep === index ? '#B38B36 !important' : '#E0E0E0' } }}
                    onClick={() => {
                      if (dbStep >= index) {
                        setActiveStep(index);
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: activeStep === index ? 700 : 500, color: activeStep >= index || dbStep >= index ? 'text.primary' : 'text.secondary' }}>
                        {label}
                      </Typography>
                      {dbStep > index ? (
                        <Typography variant="caption" color="success.main">Completed • {dateStr}</Typography>
                      ) : activeStep === index && dbStep === index ? (
                        <Typography variant="caption" color="primary.main" fontWeight="bold">In Progress</Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Pending</Typography>
                      )}
                    </Box>
                  </StepLabel>
                </Step>
              )})}
              <Step>
                 <StepLabel sx={{ '& .MuiStepIcon-root': { color: activeStep >= 5 ? '#4CAF50 !important' : '#E0E0E0' } }}>
                    <Typography sx={{ fontWeight: activeStep >= 5 ? 700 : 500, color: activeStep >= 5 ? 'text.primary' : 'text.secondary' }}>
                      Work Order Active
                    </Typography>
                 </StepLabel>
              </Step>
            </Stepper>
          </Paper>
        </Box>

      </Box>

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
      {/* EDIT DETAILS DIALOG */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Enquiry Details</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
          <TextField 
            label="Contact Number" 
            fullWidth 
            value={editFormData.clientContact}
            onChange={(e) => setEditFormData({...editFormData, clientContact: e.target.value})}
          />
          <TextField 
            label="Lead Source" 
            fullWidth 
            value={editFormData.enquirySource}
            onChange={(e) => setEditFormData({...editFormData, enquirySource: e.target.value})}
          />
          <TextField 
            label="Requirements / Scope of Work" 
            fullWidth 
            multiline 
            rows={4}
            value={editFormData.description}
            onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
          />
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setIsEditDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="primary" onClick={async () => {
            try {
              await updateProject({ id: id as string, data: editFormData }).unwrap();
              setIsEditDialogOpen(false);
              refetch();
            } catch (err) {
              console.error(err);
            }
          }}>Save Changes</Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ProjectDetails;

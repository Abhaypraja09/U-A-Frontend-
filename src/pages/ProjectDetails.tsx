import React, { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Paper, Stepper, Step, StepLabel, TextField, Divider, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Avatar, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Autocomplete, Snackbar, createFilterOptions, InputAdornment, Grid, LinearProgress, Tabs, Tab } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { 
  useGetProjectByIdQuery, useUpdateProjectMutation, useCreateQuotationMutation, 
  useCreateInvoiceMutation, useUploadFilesMutation, useGetDrawingsQuery, 
  useAddDrawingMutation, useApproveDrawingMutation,
  useGetProjectMaterialsQuery, useReserveProjectMaterialMutation,
  useGetProjectProductionLogsQuery, useCreateProductionLogMutation, useUpdateProductionLogMutation,
  useGetInventoryQuery, useGetCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation,
  useGetUnitsQuery, useCreateUnitMutation, useDeleteUnitMutation,
  useDeleteDrawingMutation, useUpdateDrawingMutation, useGetMachineLogsQuery, useUpdateQuotationMutation
} from '../store/apiSlice';
import { generateReceiptPDF, generateWorkOrderPDF, generateQuotationPDF } from '../utils/pdfGenerator';

const crmSteps = ['Enquiry Details', 'Reference Image', 'Quotation & Costing', 'Advance Payment'];
const projectSteps = ['Shop Drawing & Approval', 'Material Planning', 'Production', 'Work Order Active'];
const steps = [...crmSteps, ...projectSteps];

const filter = createFilterOptions<any>();

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: project, isLoading, refetch } = useGetProjectByIdQuery(id as string);
  const { data: drawings, refetch: refetchDrawings } = useGetDrawingsQuery(id as string);
  const [updateProject] = useUpdateProjectMutation();
  const [createQuotation] = useCreateQuotationMutation();
  const [updateQuotation] = useUpdateQuotationMutation();
  const [createInvoice] = useCreateInvoiceMutation();
  const [uploadFiles] = useUploadFilesMutation();
  const [addDrawing] = useAddDrawingMutation();
  const [approveDrawing] = useApproveDrawingMutation();

  const { data: projectMaterials, refetch: refetchMaterials } = useGetProjectMaterialsQuery(id as string, { skip: !id });
  const [reserveMaterial] = useReserveProjectMaterialMutation();
  const { data: productionLogs, refetch: refetchProduction } = useGetProjectProductionLogsQuery(id as string, { skip: !id });
  const [createProductionLog] = useCreateProductionLogMutation();
  const [updateProductionLog] = useUpdateProductionLogMutation();
  const { data: inventoryItems } = useGetInventoryQuery();
  const { data: allMachineLogs, isLoading: machineLogsLoading } = useGetMachineLogsQuery();
  const projectMachineLogs = allMachineLogs?.filter((log: any) => log.projectId === id) || [];

  const [activeStep, setActiveStep] = useState(0);
  const [viewingStepOverride, setViewingStepOverride] = useState<number | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const viewParam = queryParams.get('view');

  React.useEffect(() => {
    setViewingStepOverride(viewParam !== null ? parseInt(viewParam, 10) : null);
  }, [viewParam]);
  const [designFinalizedDate, setDesignFinalizedDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [cameraPurpose, setCameraPurpose] = useState<'drawing' | 'clientPhoto'>('drawing');

  // Product Production States
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productionForm, setProductionForm] = useState({ stage: 'cutting', quantityProduced: 1, remarks: '' });
  const handleProductProductionSubmit = async () => {
    if (!selectedProduct) return;
    try {
      await createProductionLog({
        projectId: id,
        stage: productionForm.stage,
        quantityProduced: productionForm.quantityProduced,
        remarks: productionForm.remarks,
        transactionType: 'IN', // As it's produced
        productId: selectedProduct.id,
        productName: selectedProduct.name
      }).unwrap();
      setSnackbarMessage(`Successfully recorded ${productionForm.quantityProduced} for ${selectedProduct.name}`);
      setProductionDialogOpen(false);
      setProductionForm({ stage: 'cutting', quantityProduced: 1, remarks: '' });
      refetch();
    } catch (err) {
      console.error('Failed to log product production', err);
      setSnackbarMessage('Error logging production');
    }
  };
  
  // Edit Drawing Dialog States
  const [isEditDrawingOpen, setIsEditDrawingOpen] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState<any>(null);
  const [editDrawingTitle, setEditDrawingTitle] = useState('');
  const [editDrawingComments, setEditDrawingComments] = useState('');

  const [deleteDrawing] = useDeleteDrawingMutation();
  const [updateDrawing] = useUpdateDrawingMutation();

  // Edit Dialog States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    clientName: '',
    clientContact: '',
    enquirySource: '',
    location: '',
    description: '',
    createdAt: '',
    customerPhoto: ''
  });

  // Form states
  const [designFiles, setDesignFiles] = useState<{name: string, url: string, file?: File | Blob}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProducts, setEditingProducts] = useState<Product[]>([]);
  const [cameraProductIndex, setCameraProductIndex] = useState<number | null>(null);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
  const [reserveQty, setReserveQty] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [customCostName, setCustomCostName] = useState('');
  
  type Product = {
    id: string;
    category: string;
    unit: string;
    length: number;
    width: number;
    breadth: number;
    qty: number;
    rate: number;
    amount: number;
    photo?: string;
  };
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`quoteProducts_${id}`);
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    localStorage.setItem(`quoteProducts_${id}`, JSON.stringify(products));
  }, [products, id]);

  const [activeCostProductId, setActiveCostProductId] = useState<string>('');
  const [isCategoryCostsDialogOpen, setIsCategoryCostsDialogOpen] = useState<boolean>(false);

  const getDefaultCosts = () => [
      { id: 'mat', name: 'Material Cost', amount: 0 },
      { id: 'cnc', name: 'CNC Cost', amount: 0 },
      { id: 'hc', name: 'Hand Carving Cost', amount: 0 },
      { id: 'inlay', name: 'Inlay Cost', amount: 0 },
      { id: 'polish', name: 'Polishing Cost', amount: 0 },
      { id: 'pack', name: 'Packing Cost', amount: 0 },
      { id: 'trans', name: 'Transport Cost', amount: 0 },
      { id: 'inst', name: 'Installation Cost', amount: 0 }
  ];

  const [quoteDetails, setQuoteDetails] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem(`quoteDraft_${id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
          return { default: parsed };
      }
      if (parsed && typeof parsed === 'object') {
          if (parsed.materialCost !== undefined) {
             return { default: [
               { id: 'mat', name: 'Material Cost', amount: parsed.materialCost || 0 },
               { id: 'cnc', name: 'CNC Cost', amount: parsed.cncCost || 0 },
               { id: 'hc', name: 'Hand Carving Cost', amount: parsed.handCarvingCost || 0 },
               { id: 'inlay', name: 'Inlay Cost', amount: parsed.inlayCost || 0 },
               { id: 'polish', name: 'Polishing Cost', amount: parsed.polishingCost || 0 },
               { id: 'pack', name: 'Packing Cost', amount: parsed.packingCost || 0 },
               { id: 'trans', name: 'Transport Cost', amount: parsed.transportCost || 0 },
               { id: 'inst', name: 'Installation Cost', amount: parsed.installationCost || 0 }
             ]};
          }
          return parsed;
      }
    }
    return {};
  });

  React.useEffect(() => {
    localStorage.setItem(`quoteDraft_${id}`, JSON.stringify(quoteDetails));
  }, [quoteDetails, id]);

  const [advancePayment, setAdvancePayment] = useState(0);
  const [productionTab, setProductionTab] = useState(0);

  const { data: categories = [] } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const { data: units = [] } = useGetUnitsQuery();
  const [createUnit] = useCreateUnitMutation();
  const [deleteUnit] = useDeleteUnitMutation();

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
    if (status === 'material_planning') return 5;
    if (status === 'production') return 6;
    if (status === 'work_order' || status === 'completed') return 7;
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
      if (project.startDate) {
        setDesignFinalizedDate(new Date(project.startDate).toISOString().split('T')[0]);
      }
      if (project.invoices && project.invoices.length > 0) {
        const inv = project.invoices[0];
        setAdvancePayment(inv.advancePaid || 0);
        if (inv.paymentMethod) setPaymentMethod(inv.paymentMethod);
        if (inv.paymentDate) setPaymentDate(new Date(inv.paymentDate).toISOString().split('T')[0]);
      }

      // Load saved quotation from database if project is past the quotation stage,
      // OR if no local draft exists (or draft is empty).
      if (project.quotations && project.quotations.length > 0) {
        const latestQuote = project.quotations[0];
        const isPastQuotation = getStepIndex(project.status) > 2;

        const savedProductsStr = localStorage.getItem(`quoteProducts_${id}`);
        const savedProducts = savedProductsStr ? JSON.parse(savedProductsStr) : [];

        const savedDraftStr = localStorage.getItem(`quoteDraft_${id}`);
        const savedDraft = savedDraftStr ? JSON.parse(savedDraftStr) : null;

        if (isPastQuotation || savedProducts.length === 0) {
          if (latestQuote.products) {
            setProducts(latestQuote.products as any);
          }
        }

        if (!savedDraft) {
          if (latestQuote.additionalCosts && typeof latestQuote.additionalCosts === 'object') {
            if (Array.isArray(latestQuote.additionalCosts)) {
               setQuoteDetails({ default: latestQuote.additionalCosts });
            } else if ((latestQuote.additionalCosts as any).materialCost !== undefined) {
               setQuoteDetails({ default: [
                 { id: 'mat', name: 'Material Cost', amount: (latestQuote.additionalCosts as any).materialCost || 0 },
                 { id: 'cnc', name: 'CNC Cost', amount: (latestQuote.additionalCosts as any).cncCost || 0 },
                 { id: 'hc', name: 'Hand Carving Cost', amount: (latestQuote.additionalCosts as any).handCarvingCost || 0 },
                 { id: 'inlay', name: 'Inlay Cost', amount: (latestQuote.additionalCosts as any).inlayCost || 0 },
                 { id: 'polish', name: 'Polishing Cost', amount: (latestQuote.additionalCosts as any).polishingCost || 0 },
                 { id: 'pack', name: 'Packing Cost', amount: (latestQuote.additionalCosts as any).packingCost || 0 },
                 { id: 'trans', name: 'Transport Cost', amount: (latestQuote.additionalCosts as any).transportCost || 0 },
                 { id: 'inst', name: 'Installation Cost', amount: (latestQuote.additionalCosts as any).installationCost || 0 }
               ]});
            } else {
               setQuoteDetails(latestQuote.additionalCosts as any);
            }
          } else {
            setQuoteDetails({});
          }
        }
      }
    }
  }, [project, id]);

  // Clean up camera stream when dialog closes or component unmounts
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async (purpose: 'drawing' | 'clientPhoto' = 'drawing') => {
    setCameraPurpose(purpose);
    setIsCameraOpen(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setSnackbarMessage("Could not access camera. Please check permissions.");
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
            const fileName = `Captured_Photo_${new Date().getTime()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            stopCamera();
            
            setIsUploading(true);
            const formData = new FormData();
            formData.append('files', file);
            try {
              const res = await uploadFiles(formData).unwrap();
              if (res.success && res.urls.length > 0) {
                const url = res.urls[0];
                if (cameraPurpose === 'clientPhoto') {
                  setEditFormData(prev => {
                    const photos = prev.customerPhoto ? prev.customerPhoto.split(',').filter(Boolean) : [];
                    return { ...prev, customerPhoto: [...photos, url].join(',') };
                  });
                  setSnackbarMessage('Client photo captured successfully!');
                } else if (cameraPurpose === 'productPhoto') {
                  if (cameraProductIndex !== null) {
                    const ep = editingProducts[cameraProductIndex];
                    const existing = ep.photo ? ep.photo.split(',').filter(Boolean) : [];
                    handleUpdateEditingProduct(cameraProductIndex, 'photo', [...existing, url].join(','));
                    setCameraProductIndex(null);
                  }
                  setSnackbarMessage('Product design photo captured successfully!');
                } else {
                  const currentStepVal = viewingStepOverride !== null ? viewingStepOverride : activeStep;
                  const type = currentStepVal === 1 ? 'Reference Design' : 'Shop Drawing';
                  const title = currentStepVal === 1 ? 'Reference Design Photo' : 'Shop Drawing Photo';
                  await addDrawing({ projectId: id, title, type, fileUrl: url }).unwrap();
                  setSnackbarMessage('Drawing photo captured successfully!');
                  refetchDrawings();
                }
              }
            } catch (err) {
              console.error(err);
              setSnackbarMessage('Upload failed');
            } finally {
              setIsUploading(false);
            }
          }
        }, 'image/jpeg');
      }
    }
  };



  const calculateAmount = (p: Product) => {
    let amount = 0;
    const lengthDec = p.length || 0;
    const widthDec = p.width || 0;
    const breadthDec = p.breadth || 1; // Default to 1 if breadth is 0

    if (p.unit !== 'Pieces') {
      amount = lengthDec * widthDec * breadthDec * p.qty * p.rate;
    } else {
      amount = p.qty * p.rate;
    }
    return Math.round(amount);
  };

  const handleAddProduct = () => {
    setEditingProducts([{
      id: Date.now().toString(),
      category: '',
      unit: '',
      length: 0,
      width: 0,
      breadth: 0,
      qty: 1, rate: 0, amount: 0
    }]);
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProducts([p]);
    setIsProductDialogOpen(true);
  };

  const handleUpdateEditingProduct = (index: number, field: string, value: any) => {
    const updatedArray = [...editingProducts];
    const updated = { ...updatedArray[index], [field]: value };
    updated.amount = calculateAmount(updated);
    updatedArray[index] = updated;
    setEditingProducts(updatedArray);
  };

  const handleAddNewRow = () => {
    setEditingProducts([...editingProducts, {
      id: Date.now().toString() + Math.random().toString(),
      category: '',
      unit: '',
      length: 0,
      width: 0,
      breadth: 0,
      qty: 1, rate: 0, amount: 0
    }]);
  };

  const handleRemoveRow = (index: number) => {
    setEditingProducts(editingProducts.filter((_, i) => i !== index));
  };

  const handleSaveProducts = async () => {
    let newProducts = [...products];
    editingProducts.forEach(ep => {
      const existingIdx = newProducts.findIndex(p => p.id === ep.id);
      if (existingIdx >= 0) {
        newProducts[existingIdx] = ep;
      } else {
        newProducts.push(ep);
      }
    });
    setProducts(newProducts);
    setIsProductDialogOpen(false);
    setEditingProducts([]);

    // Persist to backend if a quotation exists for this project
    try {
      const { data: quotations } = await fetch(`/api/quotations/project/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.json()).then(data => ({ data }));
      if (quotations && quotations.length > 0) {
        await updateQuotation({ id: quotations[0].id, data: { products: newProducts } });
      }
    } catch (e) {
      // Silent fail - products are still updated in local state
      console.error('Failed to persist products to quotation:', e);
    }
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
      await updateProject({ 
        id: id as string, 
        data: { 
          status: 'quotation', 
          startDate: designFinalizedDate ? new Date(designFinalizedDate).toISOString() : null 
        } 
      }).unwrap();
      setActiveStep(getStepIndex('quotation'));
      setViewingStepOverride(null);
      refetch();
    } catch (err) {
      console.error("Failed to proceed to costing", err);
      setSnackbarMessage("Error saving data before proceeding.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateQuotation = async () => {
    try {
      await createQuotation({ projectId: id, products, additionalCosts: quoteDetails }).unwrap();
      localStorage.removeItem(`quoteDraft_${id}`);
      localStorage.removeItem(`quoteProducts_${id}`);
      await handleNextStage('advance_payment');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvancePayment = async () => {
    try {
      const productsTotal = products.reduce((acc, p) => acc + p.amount, 0);
      const additionalTotal = Array.isArray(quoteDetails)
        ? quoteDetails.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        : 0;
      const totalAmount = productsTotal + additionalTotal;

      await createInvoice({ 
        projectId: id, 
        totalAmount, 
        advancePaid: advancePayment, 
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null,
        dueDate: paymentDate ? new Date(paymentDate).toISOString() : null
      }).unwrap();
      
      await handleNextStage('shop_drawing');
      setViewingStepOverride(null);
      setSnackbarMessage("Payment recorded! Proceeding to Shop Drawings.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditDrawingClick = (drawing: any) => {
    setEditingDrawing(drawing);
    setEditDrawingTitle(drawing.title || '');
    setEditDrawingComments(drawing.comments || '');
    setIsEditDrawingOpen(true);
  };

  const handleSaveDrawingEdit = async () => {
    try {
      await updateDrawing({
        id: editingDrawing.id,
        projectId: id as string,
        body: { title: editDrawingTitle, comments: editDrawingComments }
      }).unwrap();
      setIsEditDrawingOpen(false);
      refetchDrawings();
      setSnackbarMessage('Drawing updated successfully!');
    } catch (err) {
      console.error(err);
      setSnackbarMessage('Failed to update drawing');
    }
  };

  const handleDeleteDrawingClick = async (drawingId: string) => {
    if (window.confirm("Are you sure you want to delete this drawing?")) {
      try {
        await deleteDrawing({ id: drawingId, projectId: id as string }).unwrap();
        refetchDrawings();
        setSnackbarMessage('Drawing deleted successfully!');
      } catch (err) {
        console.error(err);
        setSnackbarMessage('Failed to delete drawing');
      }
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

  const isCrmView = location.pathname.includes('/crm');
  const isProjectActive = project ? ['shop_drawing', 'material_planning', 'production', 'work_order', 'completed'].includes(project.status) : false;
  const currentSteps = isCrmView ? crmSteps : projectSteps;
  const displayActiveStep = isCrmView
    ? (activeStep < 4 ? activeStep : 4)
    : (activeStep >= 4 ? activeStep - 4 : 0);
  const stepToRender = viewingStepOverride !== null 
    ? viewingStepOverride 
    : (isCrmView ? Math.min(3, activeStep) : Math.max(4, activeStep));

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
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
          {/* CONTENT AREA */}
          <Box sx={{ minHeight: 400 }}>
            
            {/* VIEWING OVERRIDE WARNING BANNER */}
            {viewingStepOverride !== null && isProjectActive && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                p: 2.5, 
                mb: 4, 
                bgcolor: '#FFF9E6', 
                border: '1.5px solid #FFD54F', 
                borderRadius: 3,
                boxShadow: '0 4px 15px rgba(255, 179, 0, 0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <InfoIcon sx={{ color: '#B38B36', fontSize: '1.75rem' }} />
                  <Typography variant="body1" color="text.primary" fontWeight="600">
                    You are viewing a past CRM stage: <span style={{ color: '#B38B36', fontWeight: '800' }}>{crmSteps[viewingStepOverride] || crmSteps[0]}</span>
                  </Typography>
                </Box>
                <Button 
                  variant="contained" 
                  size="medium" 
                  onClick={() => navigate(`/projects/${id}`)}
                  sx={{ 
                    bgcolor: '#B38B36', 
                    color: '#fff', 
                    '&:hover': { bgcolor: '#936F28' }, 
                    borderRadius: 2, 
                    textTransform: 'none', 
                    fontWeight: 'bold',
                    px: 3,
                    boxShadow: '0 2px 8px rgba(179, 139, 54, 0.2)'
                  }}
                >
                  Back to Active Step
                </Button>
              </Box>
            )}
            
            {/* STEP 0: ENQUIRY DETAILS */}
            {stepToRender === 0 && (
              <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">Enquiry Details</Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>Review the initial requirements and client information.</Typography>
                  </Box>
                  <Button variant="outlined" startIcon={<EditIcon />} onClick={() => {
                    setEditFormData({
                      name: project.name || '',
                      clientName: project.clientName || '',
                      clientContact: project.clientContact || '',
                      enquirySource: project.enquirySource || '',
                      location: project.location || '',
                      description: project.description || '',
                      createdAt: project.createdAt ? new Date(project.createdAt).toISOString().split('T')[0] : '',
                      customerPhoto: project.customerPhoto || ''
                    });
                    setIsEditDialogOpen(true);
                  }}>Edit Details</Button>
                </Box>
                
                 <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 4, mb: 4 }}>
                  {project.customerPhoto && (
                    <Box sx={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">Client Photos</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {project.customerPhoto.split(',').filter(Boolean).map((photoUrl, idx) => (
                          <Avatar 
                            key={idx}
                            src={photoUrl} 
                            alt={`Client Photo ${idx + 1}`} 
                            variant="rounded"
                            onClick={() => setPreviewFileUrl(photoUrl)}
                            sx={{ width: 100, height: 100, border: '2px solid #E8E1D5', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)', cursor: 'pointer', '&:hover': { opacity: 0.8 } }} 
                          />
                        ))}
                      </Box>
                    </Box>
                  )}                  <Box>
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
                    <Typography variant="body1" fontWeight={500} mt={0.5}>{new Date(project.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</Typography>
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" size="large" onClick={() => {
                    setSnackbarMessage('Enquiry Details progress saved!');
                    if (viewingStepOverride !== null) setViewingStepOverride(null);
                  }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                    {viewingStepOverride !== null ? 'Save Changes' : 'Save Progress'}
                  </Button>
                  <Button variant="contained" size="large" onClick={() => {
                    if (viewingStepOverride !== null) setViewingStepOverride(null);
                    else handleNextStage('design_sharing');
                  }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                    {viewingStepOverride !== null ? 'Back to Active Step' : 'Proceed to Reference Image'}
                  </Button>
                </Box>
              </Paper>
            )}

            {/* STEP 1: REFERENCE IMAGE */}
            {stepToRender === 1 && (
              <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">Reference Image</Typography>
                    <Typography variant="body1" color="text.secondary" mt={1}>Upload the finalized reference design images, material choices, and inspiration photos.</Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}><strong>Current Date:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</Typography>
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
                                await addDrawing({ projectId: id, title: 'Reference Design', type: 'Reference Design', fileUrl: url }).unwrap();
                              }
                              refetchDrawings();
                              setSnackbarMessage('Images uploaded successfully!');
                            } catch (err) {
                              console.error(err);
                              setSnackbarMessage('Upload failed');
                            } finally {
                              setIsUploading(false);
                              e.target.value = '';
                            }
                          }
                        }} 
                      />
                    </Box>

                    <Box 
                      onClick={isUploading ? undefined : startCamera}
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
                    </Box>
                  </Box>
                </Box>

                {/* Calendar Finalized Design Date Selector */}
                <Box sx={{ mb: 4, display: 'flex', gap: 2, flexDirection: 'column', maxWidth: 300 }}>
                  <Typography variant="body2" fontWeight="bold" color="text.secondary">Design Finalized Date</Typography>
                  <TextField 
                    type="date"
                    value={designFinalizedDate}
                    onChange={(e) => setDesignFinalizedDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                </Box>

                {/* Uploaded Reference Designs list */}
                {drawings && drawings.filter((d: any) => d.type === 'Reference Design').length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" mb={2}>Finalized Reference Designs</Typography>
                    {drawings.filter((d: any) => d.type === 'Reference Design').map((drawing: any) => (
                      <Box key={drawing.id} sx={{ display: 'flex', alignItems: 'center', p: 2, border: '1px solid #EEE', borderRadius: 2, mb: 2 }}>
                        <Box 
                          onClick={() => setPreviewFileUrl(drawing.fileUrl)}
                          sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', mr: 2, cursor: 'pointer', border: '1px solid #E0E0E0', flexShrink: 0, bgcolor: '#F9F9F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {drawing.fileUrl.toLowerCase().endsWith('.pdf') ? (
                            <Typography variant="h6" color="text.secondary">PDF</Typography>
                          ) : (
                            <img src={drawing.fileUrl} alt="Drawing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">{drawing.title} (v{drawing.version})</Typography>
                          {drawing.comments && <Typography variant="body2" color="text.secondary">Comments: {drawing.comments}</Typography>}
                          <Typography variant="caption" color="text.secondary">{new Date(drawing.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</Typography>
                          <Typography 
                            onClick={() => setPreviewFileUrl(drawing.fileUrl)} 
                            sx={{ color: '#1976d2', textDecoration: 'underline', fontSize: 14, cursor: 'pointer', mt: 0.5, display: 'block', width: 'fit-content' }}
                          >
                            View File
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => handleEditDrawingClick(drawing)}>Edit</Button>
                          <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => handleDeleteDrawingClick(drawing.id)}>Delete</Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="outlined" size="large" onClick={() => {
                    if (viewingStepOverride !== null) setViewingStepOverride(null);
                    else handleNextStage('enquiry');
                  }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                    Back
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" size="large" onClick={async () => {
                      try {
                         await updateProject({ id: id as string, data: { startDate: designFinalizedDate ? new Date(designFinalizedDate).toISOString() : null } }).unwrap();
                         setSnackbarMessage('Progress saved successfully!');
                         if (viewingStepOverride !== null) setViewingStepOverride(null);
                      } catch(e) {
                         setSnackbarMessage('Failed to save progress.');
                      }
                    }} disabled={isUploading} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                      {viewingStepOverride !== null ? 'Save Changes' : 'Save Progress'}
                    </Button>
                    <Button variant="contained" size="large" onClick={() => {
                       if (viewingStepOverride !== null) setViewingStepOverride(null);
                       else handleFreezeDesign();
                    }} disabled={isUploading} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                      {viewingStepOverride !== null ? 'Back to Active Step' : (isUploading ? 'Saving & Proceeding...' : 'Proceed to Costing')}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* STEP 2: QUOTATION & COSTING */}
            {stepToRender === 2 && (
              <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
                <Typography variant="h5" fontWeight="bold" mb={4} color="text.primary">Quotation & Costing Builder</Typography>
                
                <Box sx={{ mb: 4, p: 3, border: '1px solid #E0E0E0', borderRadius: 3, bgcolor: '#FAFAFA' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Product Estimation</Typography>
                    <Button variant="contained" onClick={handleAddProduct} sx={{ borderRadius: 2 }}>+ Add Product</Button>
                  </Box>
                  <TableContainer sx={{ border: '1px solid #E0E0E0', borderRadius: 2, mb: 2, overflowX: 'auto', '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#CCC', borderRadius: 4 } }}>
                    <Table size="small" sx={{ minWidth: 850 }}>
                      <TableHead sx={{ bgcolor: '#F5F5F5' }}>
                        <TableRow>
                          <TableCell sx={{ py: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Category</TableCell>
                          <TableCell sx={{ py: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Unit</TableCell>
                          <TableCell sx={{ py: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Length (L)</TableCell>
                          <TableCell sx={{ py: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Width (W)</TableCell>
                          <TableCell sx={{ py: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Breadth (B)</TableCell>
                          <TableCell sx={{ py: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Qty</TableCell>
                          <TableCell sx={{ py: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Rate</TableCell>
                          <TableCell sx={{ py: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Amount</TableCell>
                          <TableCell sx={{ py: 1.5 }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {products.map(p => (
                          <TableRow key={p.id} sx={{ '& td': { borderBottom: '1px solid #F0F0F0', py: 1.5 } }}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {p.photo ? (
                                  <Avatar 
                                    src={p.photo} 
                                    variant="rounded" 
                                    onClick={() => setPreviewFileUrl(p.photo!)}
                                    sx={{ width: 40, height: 40, border: '1px solid #E8E1D5', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                  />
                                ) : (
                                  <Box 
                                    sx={{ 
                                      width: 40, 
                                      height: 40, 
                                      border: '1px dashed #CCC', 
                                      borderRadius: 1.5, 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      bgcolor: '#FAFAFA'
                                    }}
                                  >
                                    <ImageIcon sx={{ fontSize: '1.2rem', color: '#AAA' }} />
                                  </Box>
                                )}
                                <Box>
                                  <Typography variant="body2">{p.category}</Typography>
                                  <Button 
                                    size="small" 
                                    variant="text" 
                                    sx={{ fontSize: '0.7rem', p: 0, minWidth: 'auto', mt: 0.5, color: 'primary.main', textTransform: 'none' }}
                                    onClick={() => {
                                      setActiveCostProductId(p.id);
                                      if (!quoteDetails[p.id]) {
                                        setQuoteDetails(prev => ({ ...prev, [p.id]: getDefaultCosts() }));
                                      }
                                      setIsCategoryCostsDialogOpen(true);
                                    }}
                                  >
                                    + Add Costs
                                  </Button>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell><Typography variant="body2">{p.unit}</Typography></TableCell>
                            <TableCell>
                              {p.unit !== 'Pieces' ? <Typography variant="body2">{p.length}</Typography> : <Typography variant="body2" color="text.secondary">-</Typography>}
                            </TableCell>
                            <TableCell>
                              {p.unit !== 'Pieces' ? <Typography variant="body2">{p.width}</Typography> : <Typography variant="body2" color="text.secondary">-</Typography>}
                            </TableCell>
                            <TableCell>
                              {p.unit !== 'Pieces' ? <Typography variant="body2">{p.breadth || 0}</Typography> : <Typography variant="body2" color="text.secondary">-</Typography>}
                            </TableCell>
                            <TableCell><Typography variant="body2">{p.qty}</Typography></TableCell>
                            <TableCell><Typography variant="body2">₹{p.rate.toLocaleString('en-IN')}</Typography></TableCell>
                            <TableCell><Typography variant="body2" fontWeight="bold" color="#B38B36">₹{p.amount.toLocaleString('en-IN')}</Typography></TableCell>
                            <TableCell align="right">
                              <IconButton color="primary" size="small" onClick={() => handleEditProduct(p)} sx={{ mr: 1, bgcolor: '#E3F2FD', '&:hover': { bgcolor: '#BBDEFB' } }}><EditIcon fontSize="small" /></IconButton>
                              <IconButton color="error" size="small" onClick={() => handleRemoveProduct(p.id)} sx={{ bgcolor: '#FFEBEE', '&:hover': { bgcolor: '#FFCDD2' } }}><DeleteIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {products.length === 0 && (
                          <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No products added. Click "+ Add Product".</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Total Products Amount: ₹{products.reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-IN')}</Typography>
                  </Box>
                </Box>

                {/* INLINE ADDITIONAL COSTS */}
                {(() => {
                  const currentCostId = activeCostProductId || (products.length > 0 ? products[0].id : null);
                  return (
                    <Box sx={{ mb: 4, p: 3, border: '1px solid #E0E0E0', borderRadius: 3, bgcolor: '#FAFAFA' }}>
                      <Typography variant="h6" fontWeight="bold" mb={3}>Additional Costs {currentCostId ? `for ${products.find(p => p.id === currentCostId)?.category || ''}` : ''}</Typography>
                      {currentCostId ? (
                        <Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, p: 3, bgcolor: '#FFF', borderRadius: 2, border: '1px solid #E8E1D5', mb: 2 }}>
                            {(quoteDetails[currentCostId] || getDefaultCosts()).map((item: any) => (
                              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField 
                                  fullWidth 
                                  type="number"
                                  label={item.name} 
                                  value={item.amount === 0 ? '' : item.amount}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setQuoteDetails(prev => {
                                      const list = prev[currentCostId] || getDefaultCosts();
                                      return { ...prev, [currentCostId]: list.map(c => c.id === item.id ? { ...c, amount: val } : c) };
                                    });
                                  }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                              </Box>
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button color="primary" onClick={() => { setCustomCostName(''); setIsCostDialogOpen(true); }}>
                              + Manage Cost Items
                            </Button>
                            <Typography variant="subtitle1" fontWeight="bold" color="#B38B36">
                              Total Additional Cost: ₹
                              {((quoteDetails[currentCostId] || []).reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0)).toLocaleString('en-IN')}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                         <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary', bgcolor: '#FFF', borderRadius: 2, border: '1px dashed #CCC' }}>
                           Please add a product to estimation first.
                         </Box>
                      )}
                    </Box>
                  );
                })()}


                {/* DYNAMIC ESTIMATED TOTAL QUOTE BOX WITH REAL-TIME BREAKDOWN */}
                <Box sx={{ 
                  p: 3, mb: 4, 
                  background: 'linear-gradient(90deg, #2A2D3E 0%, #1A1C29 100%)', 
                  borderRadius: 3, 
                  color: '#FFF'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#E8E1D5' }}>Total Products Amount:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>₹{products.reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#E8E1D5', fontWeight: 500 }}>Estimated Total Quote:</Typography>
                    <Typography variant="h4" sx={{ color: '#E5C07B', fontWeight: 'bold' }}>
                      ₹{
                        (products.reduce((acc, p) => acc + p.amount, 0)).toLocaleString('en-IN')
                      }
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="outlined" size="large" onClick={() => {
                    if (viewingStepOverride !== null) setViewingStepOverride(null);
                    else handleNextStage('design_sharing');
                  }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                    Back
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" size="large" onClick={() => {
                      // Triggering a save draft (localStorage) which is already handled via useEffect,
                      // or we can just notify user.
                      setSnackbarMessage('Quotation progress saved!');
                      if (viewingStepOverride !== null) setViewingStepOverride(null);
                    }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                      {viewingStepOverride !== null ? 'Save Changes' : 'Save Progress'}
                    </Button>
                    <Button variant="outlined" size="large" onClick={() => generateQuotationPDF(project, products, quoteDetails)} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                      Download PDF
                    </Button>
                    <Button variant="contained" size="large" onClick={async () => {
                      if (viewingStepOverride !== null) {
                         setViewingStepOverride(null);
                      } else {
                         await handleCreateQuotation();
                      }
                    }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                      {viewingStepOverride !== null ? 'Back to Active Step' : 'Save & Generate Quotation'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* STEP 3: ADVANCE PAYMENT */}
            {stepToRender === 3 && (
              <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
                <Typography variant="h5" fontWeight="bold" mb={2} color="text.primary">Advance Payment</Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>Enter the advance payment received to freeze this project and convert it into an Active Work Order.</Typography>
                
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', mb: 4 }}>
                  <TextField 
                    type="number"
                    label="Advance Payment Received (₹)" 
                    value={advancePayment === 0 ? '' : advancePayment}
                    onChange={(e) => setAdvancePayment(Number(e.target.value))}
                    sx={{ width: 250, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentMethod}
                      label="Payment Method"
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank">Bank Transfer / Online</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField 
                    type="date"
                    label="Payment Date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  
                  {advancePayment > 0 && (
                    <Button variant="outlined" color="primary" onClick={handleDownloadReceipt} sx={{ height: 56, borderRadius: 2 }}>
                      Download Receipt PDF
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="outlined" size="large" onClick={() => {
                    if (viewingStepOverride !== null) setViewingStepOverride(null);
                    else handleNextStage('quotation');
                  }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                    Back
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" size="large" onClick={async () => {
                        // Saving payment details locally in state. Actual invoice generation happens on proceed.
                        localStorage.setItem(`paymentDraft_${id}`, JSON.stringify({
                          advancePayment, paymentDate, paymentMethod
                        }));
                        setSnackbarMessage('Payment progress saved!');
                        if (viewingStepOverride !== null) setViewingStepOverride(null);
                    }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                      {viewingStepOverride !== null ? 'Save Changes' : 'Save Progress'}
                    </Button>
                    <Button variant="contained" color="success" size="large" onClick={() => {
                       if (viewingStepOverride !== null) setViewingStepOverride(null);
                       else handleAdvancePayment();
                    }} startIcon={viewingStepOverride !== null ? null : <CheckCircleIcon />} sx={{ px: 4, py: 1.5, borderRadius: 2, bgcolor: viewingStepOverride !== null ? 'primary.main' : '#2E7D32', '&:hover': { bgcolor: viewingStepOverride !== null ? 'primary.dark' : '#1B5E20' } }}>
                      {viewingStepOverride !== null ? 'Back to Active Step' : 'Confirm & Proceed to Shop Drawings'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* STEP 4: SHOP DRAWING & APPROVAL */}
            {stepToRender === 4 && (
              <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">Shop Drawing & Design Approval</Typography>
                    <Typography variant="body1" color="text.secondary" mt={1}>Upload final shop drawings, production layouts, and 3D renders.</Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}><strong>Date:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</Typography>
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
                              refetchDrawings();
                              setSnackbarMessage('Drawings uploaded successfully!');
                            } catch (err) {
                              console.error(err);
                              setSnackbarMessage('Upload failed');
                            } finally {
                              setIsUploading(false);
                              e.target.value = '';
                            }
                          }
                        }} 
                      />
                    </Box>

                    {/* Camera button using webcam dialog */}
                    <Box 
                      onClick={isUploading ? undefined : startCamera}
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
                    </Box>
                  </Box>
                </Box>

                {/* Uploaded Shop Drawings List with Edit/Delete Buttons */}
                {drawings && drawings.filter((d: any) => d.type === 'Shop Drawing').length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" mb={2}>Uploaded Drawings</Typography>
                    {drawings.filter((d: any) => d.type === 'Shop Drawing').map((drawing: any) => (
                      <Box key={drawing.id} sx={{ display: 'flex', alignItems: 'center', p: 2, border: '1px solid #EEE', borderRadius: 2, mb: 2 }}>
                        <Box 
                          onClick={() => setPreviewFileUrl(drawing.fileUrl)}
                          sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', mr: 2, cursor: 'pointer', border: '1px solid #E0E0E0', flexShrink: 0, bgcolor: '#F9F9F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {drawing.fileUrl.toLowerCase().endsWith('.pdf') ? (
                            <Typography variant="h6" color="text.secondary">PDF</Typography>
                          ) : (
                            <img src={drawing.fileUrl} alt="Drawing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">{drawing.title} (v{drawing.version})</Typography>
                          {drawing.comments && <Typography variant="body2" color="text.secondary">Comments: {drawing.comments}</Typography>}
                          <Typography variant="caption" color="text.secondary">{new Date(drawing.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</Typography>
                          <Typography 
                            onClick={() => setPreviewFileUrl(drawing.fileUrl)} 
                            sx={{ color: '#1976d2', textDecoration: 'underline', fontSize: 14, cursor: 'pointer', mt: 0.5, display: 'block', width: 'fit-content' }}
                          >
                            View File
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => handleEditDrawingClick(drawing)}>Edit</Button>
                          <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => handleDeleteDrawingClick(drawing.id)}>Delete</Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="outlined" size="large" onClick={() => {
                    if (viewingStepOverride !== null) setViewingStepOverride(null);
                    else handleNextStage('advance_payment');
                  }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                    Back
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" size="large" onClick={() => {
                       setSnackbarMessage('Shop Drawing progress saved!');
                       if (viewingStepOverride !== null) setViewingStepOverride(null);
                    }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                      {viewingStepOverride !== null ? 'Save Changes' : 'Save Progress'}
                    </Button>
                    <Button variant="contained" color="success" size="large" onClick={async () => {
                      if (viewingStepOverride !== null) {
                         setViewingStepOverride(null);
                      } else {
                         await updateProject({ id: id as string, data: { status: 'material_planning' } }).unwrap();
                         setActiveStep(5);
                         setViewingStepOverride(null);
                         refetch();
                      }
                    }} sx={{ px: 4, py: 1.5, borderRadius: 2, bgcolor: viewingStepOverride !== null ? 'primary.main' : '#2E7D32', '&:hover': { bgcolor: viewingStepOverride !== null ? 'primary.dark' : '#1B5E20' } }}>
                      {viewingStepOverride !== null ? 'Back to Active Step' : 'Proceed to Material Planning'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* STEP 5: MATERIAL PLANNING */}
            {stepToRender === 5 && (
              <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
                <Typography variant="h5" fontWeight="bold" mb={4} color="text.primary">Material Planning & Procurement</Typography>
                <Typography variant="body2" color="text.secondary" mb={4}>Select blocks, slabs, or other materials from inventory to reserve for this project.</Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" mb={2}>Reserved Materials</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F5F5F5' }}>
                        <TableRow>
                          <TableCell><strong>Material Name</strong></TableCell>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell><strong>Block No.</strong></TableCell>
                          <TableCell><strong>Thickness</strong></TableCell>
                          <TableCell><strong>Quantity</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projectMaterials && projectMaterials.length > 0 ? projectMaterials.map((pm: any) => (
                          <TableRow key={pm.id}>
                            <TableCell>{pm.inventory.itemName}</TableCell>
                            <TableCell>{pm.inventory.type}</TableCell>
                            <TableCell>{pm.inventory.blockNumber || '-'}</TableCell>
                            <TableCell>{pm.inventory.thickness ? `${pm.inventory.thickness} mm` : '-'}</TableCell>
                            <TableCell>{pm.quantity} {pm.inventory.unit}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No materials reserved yet.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Box sx={{ p: 3, border: '1px dashed #B38B36', borderRadius: 3, bgcolor: '#FFFDF5', mb: 4 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="#B38B36" mb={2}>Reserve New Material</Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select from Inventory</InputLabel>
                      <Select label="Select from Inventory" defaultValue="" value="">
                        {inventoryItems && inventoryItems.map((item: any) => (
                          <MenuItem key={item.id} value={item.id} onClick={() => {
                            setSelectedInventoryItem(item);
                            setReserveQty('');
                            setReserveDialogOpen(true);
                          }}>
                            {item.itemName} (Block: {item.blockNumber || 'N/A'}) - {item.quantity} {item.unit} available
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button variant="outlined" sx={{ whiteSpace: 'nowrap' }} onClick={() => setSnackbarMessage('Navigate to Global Inventory (from sidebar) to add new stock first.')}>
                      + Add to Global Inventory
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="outlined" size="large" onClick={() => {
                    if (viewingStepOverride !== null) setViewingStepOverride(null);
                    else handleNextStage('shop_drawing');
                  }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                    Back
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" size="large" onClick={() => {
                       setSnackbarMessage('Material Planning progress saved!');
                       if (viewingStepOverride !== null) setViewingStepOverride(null);
                    }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                      {viewingStepOverride !== null ? 'Save Changes' : 'Save Progress'}
                    </Button>
                    <Button variant="contained" size="large" onClick={async () => {
                      if (viewingStepOverride !== null) {
                         setViewingStepOverride(null);
                      } else {
                         await updateProject({ id: id as string, data: { status: 'production' } }).unwrap();
                         setActiveStep(6);
                         setViewingStepOverride(null);
                         refetch();
                      }
                    }} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                      {viewingStepOverride !== null ? 'Back to Active Step' : 'Proceed to Production'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* STEP 6: PRODUCTION MANAGEMENT */}
            {stepToRender === 6 && (
              <Box sx={{ width: '100%' }}>
                {viewingStepOverride !== null && (
                   <Button startIcon={<ArrowBackIcon />} variant="text" size="small" onClick={() => setViewingStepOverride(null)} sx={{ mb: 3 }}>
                     Back to Pipeline
                   </Button>
                )}

                {/* Production Tabs */}
                <Paper sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs value={productionTab} onChange={(e, v) => setProductionTab(v)}>
                    <Tab label="Machine Usage" sx={{ fontWeight: 'bold' }} />
                    <Tab label="Material Ledger" sx={{ fontWeight: 'bold' }} />
                  </Tabs>
                </Paper>

                {/* TAB 0: Machine Usage */}
                {productionTab === 0 && (
                 <Box sx={{ mb: 6 }}>
                  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: '#FDFBF7' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4A4A4A', py: 2 }}>Machine Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4A4A4A', py: 2 }}>Category / Product Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4A4A4A', py: 2, width: '15%' }}>Qty (Done / Total)</TableCell>

                          <TableCell sx={{ fontWeight: 'bold', color: '#4A4A4A', py: 2 }}>Punch In</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4A4A4A', py: 2 }}>Punch Out</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4A4A4A', py: 2 }}>Total Hours</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4A4A4A', py: 2 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4A4A4A', py: 2 }}>Work Report</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          if (machineLogsLoading) {
                            return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Loading...</TableCell></TableRow>;
                          }
                          const tableRows: any[] = [];
                          
                          // 1. Standalone logs (no product selected)
                          if (projectMachineLogs) {
                            projectMachineLogs.filter((l: any) => !l.productId).forEach((log: any) => {
                              tableRows.push({ type: 'unassigned_log', log });
                            });
                          }
                          
                          // 2. Product pieces
                          if (products) {
                            products.forEach((product: any) => {
                              const totalQty = product.qty || 1;
                              const productLogs = (projectMachineLogs || [])
                                .filter((l: any) => l.productId === product.id)
                                .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                                
                              let completedCount = 0;
                              
                              productLogs.filter((l: any) => l.status === 'completed').forEach((log: any) => {
                                const qty = log.quantityProduced || 1;
                                for (let i = 0; i < qty; i++) {
                                  completedCount++;
                                  tableRows.push({ type: 'piece', product, pieceNumber: completedCount, status: 'completed', log });
                                }
                              });
                              
                              let activeCount = completedCount;
                              productLogs.filter((l: any) => l.status === 'active').forEach((log: any) => {
                                activeCount++;
                                tableRows.push({ type: 'piece', product, pieceNumber: activeCount, status: 'active', log });
                              });
                              
                              for (let i = activeCount + 1; i <= totalQty; i++) {
                                tableRows.push({ type: 'piece', product, pieceNumber: i, status: 'pending', log: null });
                              }
                            });
                          }
                          
                          if (tableRows.length === 0) {
                            return <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>No machines or products found for this project yet.</TableCell></TableRow>;
                          }

                          // Sort rows to show most recent activity at the top
                          tableRows.sort((a, b) => {
                            const aHasLog = !!a.log;
                            const bHasLog = !!b.log;
                            
                            if (aHasLog && bHasLog) {
                               return new Date(b.log.startTime).getTime() - new Date(a.log.startTime).getTime();
                            }
                            
                            if (aHasLog && !bHasLog) return -1;
                            if (!aHasLog && bHasLog) return 1;
                            
                            // Both pending: sort by product name, then piece number
                            const aName = a.product?.name || a.product?.category || '';
                            const bName = b.product?.name || b.product?.category || '';
                            if (aName !== bName) {
                               return aName.localeCompare(bName);
                            }
                            return (a.pieceNumber || 0) - (b.pieceNumber || 0);
                          });
                          
                          return tableRows.map((row: any, idx: number) => {
                            if (row.type === 'unassigned_log') {
                              const log = row.log;
                              return (
                                <TableRow key={`ulog-${log.id}`} sx={{ bgcolor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA', '&:hover': { bgcolor: '#F0F7F0' } }}>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'text.primary' }}>{log.machine?.name || 'Manual (No Machine)'}</TableCell>
                                  <TableCell>
                                    {log.productName ? (
                                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.95rem' }}>{log.productName}</Typography>
                                    ) : (
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'text.secondary' }}>-</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>-</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'text.primary' }}>{new Date(log.startTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'text.primary' }}>{log.endTime ? new Date(log.endTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-'}</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#2E7D32' }}>
                                    {log.endTime ? ((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2) + 'h' : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={log.status.toUpperCase()} color={log.status === 'active' ? 'warning' : 'success'} size="small" variant={log.status === 'active' ? 'filled' : 'outlined'} sx={{ fontWeight: 'bold', fontSize: '0.75rem' }} />
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'text.primary', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.remarks || ''}>
                                    {log.remarks || '-'}
                                  </TableCell>
                                </TableRow>
                              );
                            } else {
                              const { product, pieceNumber, status, log } = row;
                              return (
                                <TableRow key={`piece-${product.id}-${pieceNumber}`} sx={{ bgcolor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA', '&:hover': { bgcolor: '#F0F7F0' } }}>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: status === 'pending' ? 'text.secondary' : 'text.primary', fontStyle: status === 'pending' ? 'italic' : 'normal' }}>
                                    {log ? (log.machine?.name || 'Manual') : 'Not Started'}
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.95rem' }}>{product.name || product.category} <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>(Piece {pieceNumber} / {product.qty || 1})</Typography></Typography>
                                      {product.name && product.category && <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.85rem' }}>{product.category}</Typography>}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" fontWeight="bold" color={status === 'completed' ? 'success.main' : 'primary'} sx={{ fontSize: '0.9rem' }}>
                                          {status === 'completed' ? '1 / 1' : '0 / 1'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.9rem' }}>
                                          {status === 'completed' ? '70%' : '0%'}
                                        </Typography>
                                      </Box>
                                      <LinearProgress variant="determinate" value={status === 'completed' ? 70 : 0} color={status === 'completed' ? 'success' : 'primary'} sx={{ height: 6, borderRadius: 3 }} />
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'text.primary' }}>
                                    {log ? new Date(log.startTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-'}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'text.primary' }}>
                                    {(log && log.endTime) ? new Date(log.endTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-'}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#2E7D32' }}>
                                    {(log && log.endTime) ? ((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2) + 'h' : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {status === 'completed' && <Chip label="COMPLETED" color="success" size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }} />}
                                    {status === 'active' && <Chip label="ACTIVE" color="warning" size="small" variant="filled" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }} />}
                                    {status === 'pending' && <Chip label="PENDING" size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary', borderColor: 'divider' }} />}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'text.primary', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log?.remarks || ''}>
                                    {log?.remarks || '-'}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </Paper>
                </Box>
                )}

                {/* TAB 1: Material Ledger */}
                {productionTab === 1 && (
                  <Box sx={{ mb: 6 }}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                      <Table>
                        <TableHead sx={{ bgcolor: '#FAFAFA' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>DATE OUT</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>STAFF / VENDOR</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>STAGE / WORK</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>QTY OUT</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>QTY IN</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>PENDING</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary' }}>STATUS</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(!productionLogs || productionLogs.filter((l: any) => l.approvalStatus === 'approved' && l.transactionType === 'OUT').length === 0) ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No material outward logs found for this project.</TableCell></TableRow>
                          ) : productionLogs.filter((l: any) => l.approvalStatus === 'approved' && l.transactionType === 'OUT').map((log: any, idx: number) => {
                            const qtyOut = log.quantityProduced || 0;
                            const qtyIn = log.returnedQty || 0;
                            const pending = Math.max(0, qtyOut - qtyIn);
                            let statusLabel = 'PENDING'; let statusColor = 'error'; let progress = 0;
                            if (qtyOut === 0) { statusLabel = 'PENDING'; statusColor = 'default'; }
                            else if (qtyIn >= qtyOut) { statusLabel = 'COMPLETE'; statusColor = 'success'; progress = 100; }
                            else if (qtyIn > 0) { statusLabel = 'PARTIAL'; statusColor = 'warning'; progress = Math.round((qtyIn / qtyOut) * 100); }
                            
                            return (
                              <TableRow key={log.id} sx={{ '&:hover': { bgcolor: 'rgba(139,69,19,0.02)' } }}>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                                  {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                                    {log.vendorName ? `${log.vendorName} (Vendor)` : log.worker?.name || 'Unknown'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                                    {log.stage}
                                  </Typography>
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
                                        <LinearProgress variant="determinate" value={progress} color={statusColor as any} sx={{ height: 4, borderRadius: 2, width: 60, mx: 'auto' }} />
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Chip label="0" color="success" size="small" sx={{ fontWeight: 900 }} />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip label={statusLabel} color={statusColor as any} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Paper>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" size="large" onClick={() => {
                     setSnackbarMessage('Work Order progress saved!');
                     if (viewingStepOverride !== null) setViewingStepOverride(null);
                  }} sx={{ px: 5, py: 1.5, borderRadius: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {viewingStepOverride !== null ? 'Save Changes' : 'Save Progress'}
                  </Button>
                  <Button variant="contained" color="success" size="large" onClick={async () => {
                    if (viewingStepOverride !== null) {
                       setViewingStepOverride(null);
                    } else {
                       await updateProject({ id: id as string, data: { status: 'work_order' } }).unwrap();
                       setActiveStep(7);
                       setViewingStepOverride(null);
                       refetch();
                    }
                  }} sx={{ px: 5, py: 1.5, borderRadius: 2, bgcolor: viewingStepOverride !== null ? 'primary.main' : '#2E7D32', '&:hover': { bgcolor: viewingStepOverride !== null ? 'primary.dark' : '#1B5E20' }, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {viewingStepOverride !== null ? 'Back to Active Step' : 'Finalize & Send to Dispatch'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* STEP 7: WORK ORDER ACTIVE */}
            {stepToRender >= 7 && (
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
        {stepToRender !== 6 && (
          <Box sx={{ width: { xs: '100%', md: 350 }, flexShrink: 0, position: 'sticky', top: 24 }}>
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
            <Typography variant="h6" fontWeight="bold" mb={3} color="text.primary">Activity Log</Typography>
            
            <Stepper orientation="vertical" activeStep={displayActiveStep} sx={{ '& .MuiStepConnector-line': { minHeight: 40 } }}>
              {currentSteps.map((label, index) => {
                const absoluteIndex = isCrmView ? index : index + 4;
                const dbStep = project ? getStepIndex(project.status) : 0;
                const isCompleted = dbStep > absoluteIndex;
                const dateToShow = absoluteIndex === 0 ? project?.createdAt : project?.updatedAt;
                const dateStr = dateToShow ? new Date(dateToShow).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';

                return (
                <Step key={label}>
                  <StepLabel 
                    sx={{ cursor: dbStep >= absoluteIndex ? 'pointer' : 'default', '& .MuiStepIcon-root': { color: activeStep > absoluteIndex || dbStep > absoluteIndex ? '#4CAF50 !important' : activeStep === absoluteIndex ? '#B38B36 !important' : '#E0E0E0' } }}
                    onClick={() => {
                      if (dbStep >= absoluteIndex) {
                        setViewingStepOverride(null);
                        setActiveStep(absoluteIndex);
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: activeStep === absoluteIndex ? 700 : 500, color: activeStep >= absoluteIndex || dbStep >= absoluteIndex ? 'text.primary' : 'text.secondary' }}>
                        {label}
                      </Typography>
                      {dbStep > absoluteIndex ? (
                        <Typography variant="caption" color="success.main">Completed • {dateStr}</Typography>
                      ) : activeStep === absoluteIndex && dbStep === absoluteIndex ? (
                        <Typography variant="caption" color="primary.main" fontWeight="bold">In Progress</Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Pending</Typography>
                      )}
                    </Box>
                  </StepLabel>
                </Step>
              )})}
            </Stepper>
          </Paper>

          {stepToRender === 2 && (
            <Paper elevation={0} sx={{ p: 4, mt: 3, border: '1px solid', borderColor: '#E8E1D5', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)' }}>
              <Typography variant="h6" fontWeight="bold" color="text.primary" mb={2}>Select Category to Add Costs</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {products.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No products added yet.</Typography>
                ) : (
                  products.map(p => {
                    const currentCostId = activeCostProductId || products[0].id;
                    const isSelected = p.id === currentCostId;
                    const hasCosts = (quoteDetails[p.id] || []).some((c: any) => c.amount > 0);
                    return (
                      <Box 
                        key={p.id} 
                        onClick={() => {
                          setActiveCostProductId(p.id);
                          if (!quoteDetails[p.id]) {
                            setQuoteDetails(prev => ({ ...prev, [p.id]: getDefaultCosts() }));
                          }
                        }}
                        sx={{ 
                          p: 2, 
                          border: '1px solid', 
                          borderColor: isSelected ? '#B38B36' : '#E8E1D5', 
                          borderRadius: 2, 
                          bgcolor: isSelected ? 'rgba(179, 139, 54, 0.05)' : '#FFFDF5',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: '0.2s',
                          '&:hover': { borderColor: '#B38B36', bgcolor: 'rgba(179, 139, 54, 0.05)' }
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={isSelected ? "bold" : "medium"} color={isSelected ? "#B38B36" : "text.primary"}>{p.category}</Typography>
                        {hasCosts && <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />}
                      </Box>
                    )
                  })
                )}
              </Box>
            </Paper>
          )}

        </Box>
        )}

      </Box>


      {/* CAMERA CAPTURE DIALOG */}
      <Dialog 
        open={isCameraOpen} 
        onClose={stopCamera} 
        maxWidth="md" 
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: '#1A1C29', color: '#FFF', borderRadius: 4, border: '1px solid #333' } } }}
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
            label="Date" 
            type="date"
            fullWidth 
            value={editFormData.createdAt}
            onChange={(e) => setEditFormData({...editFormData, createdAt: e.target.value})}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField 
            label="Project / Enquiry Title" 
            fullWidth 
            value={editFormData.name}
            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
          />
          <TextField 
            label="Client Name" 
            fullWidth 
            value={editFormData.clientName}
            onChange={(e) => setEditFormData({...editFormData, clientName: e.target.value})}
          />
          <TextField 
            label="Contact Number" 
            fullWidth 
            value={editFormData.clientContact}
            onChange={(e) => setEditFormData({...editFormData, clientContact: e.target.value})}
          />
          <TextField 
            label="Location" 
            fullWidth 
            value={editFormData.location}
            onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
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
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Client Photos</Typography>
            
            {/* Grid of existing photos */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {editFormData.customerPhoto ? editFormData.customerPhoto.split(',').filter(Boolean).map((photoUrl, idx) => (
                <Box key={idx} sx={{ position: 'relative', width: 80, height: 80, border: '1px solid #CCC', borderRadius: 2, overflow: 'hidden' }}>
                  <img src={photoUrl} alt={`Client Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      const photos = editFormData.customerPhoto.split(',').filter(Boolean);
                      const updated = photos.filter((_, i) => i !== idx).join(',');
                      setEditFormData({ ...editFormData, customerPhoto: updated });
                    }}
                    sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255, 255, 255, 0.7)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } }}
                  >
                    <CloseIcon fontSize="small" sx={{ color: 'error.main' }} />
                  </IconButton>
                </Box>
              )) : null}
            </Box>

            {/* Upload & Take Photo buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                disabled={isUploading}
                sx={{ 
                  height: 100, 
                  width: 130, 
                  border: '1.5px dashed #B38B36', 
                  bgcolor: '#FFFDF5', 
                  borderRadius: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  fontSize: '0.82rem', 
                  color: '#B38B36', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  textTransform: 'none', 
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(179, 139, 54, 0.04)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': { 
                    borderColor: '#B38B36', 
                    bgcolor: '#FFF4E5', 
                    color: '#B38B36',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(179, 139, 54, 0.15)'
                  } 
                }}
              >
                <CloudUploadIcon sx={{ fontSize: '1.75rem', mb: 0.5, color: '#B38B36' }} />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setIsUploading(true);
                      const filesArray = Array.from(e.target.files);
                      const uploadPromises = filesArray.map(async (file) => {
                        const uploadData = new FormData();
                        uploadData.append('files', file);
                        const res = await uploadFiles(uploadData).unwrap();
                        return res.success && res.urls.length > 0 ? res.urls[0] : null;
                      });
                      try {
                        const urls = await Promise.all(uploadPromises);
                        const validUrls = urls.filter((url): url is string => !!url);
                        if (validUrls.length > 0) {
                          const existing = editFormData.customerPhoto ? editFormData.customerPhoto.split(',').filter(Boolean) : [];
                          const updated = [...existing, ...validUrls].join(',');
                          setEditFormData({ ...editFormData, customerPhoto: updated });
                          setSnackbarMessage('Photos uploaded successfully!');
                        }
                      } catch (err) {
                        console.error('Failed to upload client photos', err);
                        setSnackbarMessage('Upload failed');
                      } finally {
                        setIsUploading(false);
                      }
                    }
                  }}
                />
              </Button>
              <Button
                variant="outlined"
                disabled={isUploading}
                onClick={() => startCamera('clientPhoto')}
                sx={{ 
                  height: 100, 
                  width: 130, 
                  border: '1.5px dashed #B38B36', 
                  bgcolor: '#FFFDF5', 
                  borderRadius: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  fontSize: '0.82rem', 
                  color: '#B38B36', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  textTransform: 'none', 
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(179, 139, 54, 0.04)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': { 
                    borderColor: '#B38B36', 
                    bgcolor: '#FFF4E5', 
                    color: '#B38B36',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(179, 139, 54, 0.15)'
                  } 
                }}
              >
                <CameraAltIcon sx={{ fontSize: '1.75rem', mb: 0.5, color: '#B38B36' }} />
                Take Photo
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setIsEditDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="primary" onClick={async () => {
            try {
              const dataToUpdate = {
                ...editFormData,
                createdAt: editFormData.createdAt ? new Date(editFormData.createdAt).toISOString() : undefined
              };
              await updateProject({ id: id as string, data: dataToUpdate }).unwrap();
              setIsEditDialogOpen(false);
              refetch();
            } catch (err) {
              console.error(err);
            }
          }}>Save Changes</Button>
        </Box>
      </Dialog>

      {/* FILE PREVIEW DIALOG */}
      <Dialog open={!!previewFileUrl} onClose={() => setPreviewFileUrl(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          File Preview
          <IconButton onClick={() => setPreviewFileUrl(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ height: '80vh', p: 0, bgcolor: '#F5F5F5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {previewFileUrl && (
            previewFileUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewFileUrl} title="File Preview" width="100%" height="100%" style={{ border: 'none' }} />
            ) : (
              <img src={previewFileUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            )
          )}
        </DialogContent>
      </Dialog>
      {/* PRODUCT DIALOG */}
      <Dialog open={isProductDialogOpen} onClose={() => setIsProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingProducts.length === 1 && products.some(p => p.id === editingProducts[0].id) ? 'Edit Product' : 'Add Products'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 3, pb: 4 }}>
          {editingProducts.map((ep, index) => (
            <Box key={ep.id} sx={{ p: 3, border: '1px solid #EEEEEE', borderRadius: 2, bgcolor: '#FAFAFA', position: 'relative' }}>
              {editingProducts.length > 1 && (
                <IconButton 
                  size="small" 
                  color="error" 
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => handleRemoveRow(index)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl fullWidth size="small">
                  <Autocomplete
                    freeSolo
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    options={categories}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      if (option.inputValue) return option.inputValue;
                      return option.name;
                    }}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;
                      const isExisting = options.some((option) => inputValue === option.name);
                      if (inputValue !== '' && !isExisting) {
                        filtered.push({
                          inputValue,
                          name: `Add "${inputValue}"`,
                          isNew: true,
                        });
                      }
                      return filtered;
                    }}
                    value={categories.find((c: any) => c.name === ep.category) || ep.category}
                    onChange={(e, newValue) => {
                      if (typeof newValue === 'string') {
                        handleUpdateEditingProduct(index, 'category', newValue);
                      } else if (newValue && newValue.inputValue) {
                        // User selected "Add 'xxx'"
                        handleUpdateEditingProduct(index, 'category', newValue.inputValue);
                        createCategory({ name: newValue.inputValue });
                      } else if (newValue && newValue.name) {
                        handleUpdateEditingProduct(index, 'category', newValue.name);
                      } else {
                        handleUpdateEditingProduct(index, 'category', '');
                      }
                    }}
                    onInputChange={(e, newInputValue) => handleUpdateEditingProduct(index, 'category', newInputValue)}
                    renderInput={(params) => <TextField {...params} label="Category / Item Name" size="small" />}
                    renderOption={(props, option) => {
                      if (option.isNew) {
                        return (
                          <li {...props} style={{ color: '#B38B36', fontWeight: 'bold' }}>
                            {option.name}
                          </li>
                        );
                      }
                      return (
                        <li {...props} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span>{option.name}</span>
                          <IconButton 
                            size="small" 
                            color="error"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (window.confirm(`Are you sure you want to remove "${option.name}" from the category list?`)) {
                                deleteCategory(option.id);
                              }
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </li>
                      );
                    }}
                    fullWidth
                  />
                </FormControl>
                <FormControl fullWidth size="small">
                  <Autocomplete
                    freeSolo
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    options={units}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      if (option.inputValue) return option.inputValue;
                      return option.name;
                    }}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;
                      const isExisting = options.some((option) => inputValue === option.name);
                      if (inputValue !== '' && !isExisting) {
                        filtered.push({
                          inputValue,
                          name: `Add "${inputValue}"`,
                          isNew: true,
                        });
                      }
                      return filtered;
                    }}
                    value={units.find((u: any) => u.name === ep.unit) || ep.unit}
                    onChange={(e, newValue) => {
                      if (typeof newValue === 'string') {
                        handleUpdateEditingProduct(index, 'unit', newValue);
                      } else if (newValue && newValue.inputValue) {
                        handleUpdateEditingProduct(index, 'unit', newValue.inputValue);
                        createUnit({ name: newValue.inputValue });
                      } else if (newValue && newValue.name) {
                        handleUpdateEditingProduct(index, 'unit', newValue.name);
                      } else {
                        handleUpdateEditingProduct(index, 'unit', '');
                      }
                    }}
                    onInputChange={(e, newInputValue) => handleUpdateEditingProduct(index, 'unit', newInputValue)}
                    renderInput={(params) => <TextField {...params} label="Unit" size="small" />}
                    renderOption={(props, option) => {
                      if (option.isNew) {
                        return (
                          <li {...props} style={{ color: '#B38B36', fontWeight: 'bold' }}>
                            {option.name}
                          </li>
                        );
                      }
                      return (
                        <li {...props} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span>{option.name}</span>
                          <IconButton 
                            size="small" 
                            color="error"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (window.confirm(`Are you sure you want to remove "${option.name}" from the unit list?`)) {
                                deleteUnit(option.id);
                              }
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </li>
                      );
                    }}
                    fullWidth
                  />
                </FormControl>
              </Box>

              {/* Product Design Photo Upload/Camera section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Product Design Photo</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {ep.photo && ep.photo.split(',').filter(Boolean).length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {ep.photo.split(',').filter(Boolean).map((photoUrl, photoIdx) => (
                        <Box key={photoIdx} sx={{ position: 'relative', width: 80, height: 80, border: '1px solid #CCC', borderRadius: 2, overflow: 'hidden' }}>
                          <img src={photoUrl} alt="Product Design" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              const photos = ep.photo!.split(',').filter(Boolean);
                              const updated = photos.filter((_, i) => i !== photoIdx).join(',');
                              handleUpdateEditingProduct(index, 'photo', updated);
                            }}
                            sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255, 255, 255, 0.7)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } }}
                          >
                            <CloseIcon fontSize="small" sx={{ color: 'error.main' }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  ) : null}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        component="label"
                        disabled={isUploading}
                        sx={{ 
                          height: 80, 
                          width: 120, 
                          border: '1.5px dashed #B38B36', 
                          bgcolor: '#FFFDF5', 
                          borderRadius: 3, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          fontSize: '0.82rem', 
                          color: '#B38B36', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          textTransform: 'none', 
                          fontWeight: '600',
                          boxShadow: '0 2px 8px rgba(179, 139, 54, 0.04)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': { 
                            borderColor: '#B38B36', 
                            bgcolor: '#FFF4E5', 
                            color: '#B38B36',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(179, 139, 54, 0.15)'
                          } 
                        }}
                      >
                        <CloudUploadIcon sx={{ fontSize: '1.5rem', mb: 0.5, color: '#B38B36' }} />
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                        <input
                          type="file"
                          multiple
                          hidden
                          accept="image/*"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setIsUploading(true);
                              const filesArray = Array.from(e.target.files);
                              const uploadPromises = filesArray.map(async (file) => {
                                const uploadData = new FormData();
                                uploadData.append('files', file);
                                const res = await uploadFiles(uploadData).unwrap();
                                return res.success && res.urls.length > 0 ? res.urls[0] : null;
                              });
                              try {
                                const urls = await Promise.all(uploadPromises);
                                const validUrls = urls.filter((url): url is string => !!url);
                                if (validUrls.length > 0) {
                                  const existing = ep.photo ? ep.photo.split(',').filter(Boolean) : [];
                                  const updated = [...existing, ...validUrls].join(',');
                                  handleUpdateEditingProduct(index, 'photo', updated);
                                }
                              } catch (err) {
                                console.error('Failed to upload product photos', err);
                                setSnackbarMessage('Upload failed');
                              } finally {
                                setIsUploading(false);
                              }
                            }
                          }}
                        />
                      </Button>
                      <Button
                        variant="outlined"
                        disabled={isUploading}
                        onClick={() => {
                          setCameraProductIndex(index);
                          startCamera('productPhoto');
                        }}
                        sx={{ 
                          height: 80, 
                          width: 120, 
                          border: '1.5px dashed #B38B36', 
                          bgcolor: '#FFFDF5', 
                          borderRadius: 3, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          fontSize: '0.82rem', 
                          color: '#B38B36', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          textTransform: 'none', 
                          fontWeight: '600',
                          boxShadow: '0 2px 8px rgba(179, 139, 54, 0.04)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': { 
                            borderColor: '#B38B36', 
                            bgcolor: '#FFF4E5', 
                            color: '#B38B36',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(179, 139, 54, 0.15)'
                          } 
                        }}
                      >
                        <CameraAltIcon sx={{ fontSize: '1.5rem', mb: 0.5, color: '#B38B36' }} />
                        Take Photo
                      </Button>
                    </Box>
                </Box>
              </Box>

              {ep.unit !== 'Pieces' && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Length (L)</Typography>
                    <TextField size="small" type="number" value={ep.length === 0 ? '' : ep.length} onChange={e => handleUpdateEditingProduct(index, 'length', Number(e.target.value))} fullWidth />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Width (W)</Typography>
                    <TextField size="small" type="number" value={ep.width === 0 ? '' : ep.width} onChange={e => handleUpdateEditingProduct(index, 'width', Number(e.target.value))} fullWidth />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Breadth (B)</Typography>
                    <TextField size="small" type="number" value={ep.breadth === 0 ? '' : ep.breadth} onChange={e => handleUpdateEditingProduct(index, 'breadth', Number(e.target.value))} fullWidth />
                  </Box>
                </Box>
              )}

              {ep.unit === 'Pieces' ? (
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField 
                    size="small" type="number" label="Quantity (Pieces)" 
                    value={ep.qty === 0 ? '' : ep.qty} 
                    onChange={e => handleUpdateEditingProduct(index, 'qty', Number(e.target.value))} 
                    fullWidth 
                  />
                  <TextField 
                    size="small" type="number" label="Rate (per piece)" 
                    value={ep.rate === 0 ? '' : ep.rate} 
                    onChange={e => handleUpdateEditingProduct(index, 'rate', Number(e.target.value))} 
                    fullWidth 
                    slotProps={{ input: { startAdornment: <Typography variant="body2" color="text.secondary" sx={{mr: 0.5}}>₹</Typography> } as any }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField 
                    size="small" type="number" label={`Total ${ep.unit || ''}`} 
                    value={(ep.length || 0) * (ep.width || 0) * (ep.breadth || 1)} 
                    disabled 
                    fullWidth 
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                  <TextField 
                    size="small" type="number" label="Rate (per unit)" 
                    value={ep.rate === 0 ? '' : ep.rate} 
                    onChange={e => handleUpdateEditingProduct(index, 'rate', Number(e.target.value))} 
                    fullWidth 
                    slotProps={{ input: { startAdornment: <Typography variant="body2" color="text.secondary" sx={{mr: 0.5}}>₹</Typography> } as any }}
                  />
                  <TextField 
                    size="small" type="number" label="No. of Pieces" 
                    value={ep.qty === 0 ? '' : ep.qty} 
                    onChange={e => handleUpdateEditingProduct(index, 'qty', Number(e.target.value))} 
                    fullWidth 
                  />
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Item Amount:</Typography>
                <Typography variant="subtitle1" color="#B38B36" sx={{ fontWeight: 'bold' }}>₹{ep.amount.toLocaleString('en-IN')}</Typography>
              </Box>
            </Box>
          ))}
          
          <Button variant="outlined" sx={{ borderStyle: 'dashed', borderWidth: 2, py: 1.5 }} onClick={handleAddNewRow}>
            + Add Another Item
          </Button>

          <Box sx={{ p: 2, mt: 1, bgcolor: '#FFFDF5', border: '1px solid #E8E1D5', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="text.secondary">Grand Total</Typography>
            <Typography variant="h4" color="#B38B36" sx={{ fontWeight: 'bold' }}>
              ₹{editingProducts.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}
            </Typography>
          </Box>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: '#FAFAFA' }}>
          <Button onClick={() => setIsProductDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSaveProducts} sx={{ px: 4 }}>Save Products</Button>
        </Box>
      </Dialog>



      {/* ADD/EDIT ADDITIONAL COST DIALOG */}
      <Dialog open={isCostDialogOpen} onClose={() => setIsCostDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Manage Cost Items</DialogTitle>
        <DialogContent dividers sx={{ pt: 2, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
             <TextField 
                label="New Cost Item Name (e.g. Custom Polish)" 
                fullWidth 
                size="small"
                value={customCostName} 
                onChange={(e) => setCustomCostName(e.target.value)} 
             />
             <Button 
                variant="contained"
                onClick={() => {
                  if (customCostName.trim() && products.length > 0) {
                    setQuoteDetails(prev => {
                      const newState = { ...prev };
                      const newCostId = `cost_${new Date().getTime()}`;
                      products.forEach(p => {
                         const list = newState[p.id] || getDefaultCosts();
                         newState[p.id] = [
                           ...list,
                           { id: newCostId, name: customCostName.trim(), amount: 0 }
                         ];
                      });
                      return newState;
                    });
                    setCustomCostName('');
                  }
                }}
             >Add Field</Button>
          </Box>

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" color="text.secondary">Current Cost Items</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflowY: 'auto', p: 1 }}>
             {products.length > 0 && (quoteDetails[products[0].id] || getDefaultCosts()).map((item: any) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, border: '1px solid #eee', borderRadius: 2 }}>
                   <Typography variant="body2">{item.name}</Typography>
                   <IconButton 
                     size="small" 
                     color="error" 
                     onClick={() => {
                        if (window.confirm(`Are you sure you want to permanently remove "${item.name}" from ALL products?`)) {
                           setQuoteDetails(prev => {
                             const newState = { ...prev };
                             products.forEach(p => {
                               const list = newState[p.id] || [];
                               newState[p.id] = list.filter(c => c.id !== item.id);
                             });
                             return newState;
                           });
                        }
                     }}
                   >
                     <RemoveIcon />
                   </IconButton>
                </Box>
             ))}
          </Box>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setIsCostDialogOpen(false)} color="inherit">Close</Button>
        </Box>
      </Dialog>

      {/* RESERVE MATERIAL DIALOG */}
      <Dialog open={reserveDialogOpen} onClose={() => setReserveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Reserve Material</DialogTitle>
        <DialogContent dividers>
          {selectedInventoryItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Selected: <strong>{selectedInventoryItem.itemName}</strong> (Block: {selectedInventoryItem.blockNumber || 'N/A'})
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Available Stock: <strong>{selectedInventoryItem.quantity} {selectedInventoryItem.unit}</strong>
              </Typography>
              <TextField 
                label={`Quantity to Reserve (${selectedInventoryItem.unit})`} 
                type="number" 
                fullWidth 
                value={reserveQty}
                onChange={(e) => setReserveQty(e.target.value)}
                autoFocus
              />
            </Box>
          )}
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setReserveDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="primary" onClick={() => {
            if (reserveQty && !isNaN(Number(reserveQty))) {
              reserveMaterial({ 
                projectId: id as string, 
                data: { 
                  inventoryId: selectedInventoryItem.id, 
                  quantity: Number(reserveQty), 
                  cost: selectedInventoryItem.costPerUnit * Number(reserveQty) 
                } 
              }).unwrap().then(() => {
                refetchMaterials();
                setReserveDialogOpen(false);
                setSnackbarMessage('Material reserved successfully!');
              }).catch(() => {
                setSnackbarMessage('Failed to reserve material. Not enough stock?');
                setReserveDialogOpen(false);
              });
            }
          }}>Confirm Reserve</Button>
        </Box>
      </Dialog>

      {/* EDIT DRAWING DIALOG */}
      <Dialog open={isEditDrawingOpen} onClose={() => setIsEditDrawingOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Drawing Info</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField 
            label="Drawing Title" 
            fullWidth 
            value={editDrawingTitle} 
            onChange={(e) => setEditDrawingTitle(e.target.value)} 
          />
          <TextField 
            label="Comments / Notes" 
            fullWidth 
            multiline 
            rows={3} 
            value={editDrawingComments} 
            onChange={(e) => setEditDrawingComments(e.target.value)} 
          />
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setIsEditDrawingOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveDrawingEdit}>Save</Button>
        </Box>
      </Dialog>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ProjectDetails;

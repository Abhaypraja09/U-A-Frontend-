import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReceiptPDF = (project: any, advanceAmount: number) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(179, 139, 54); // #B38B36 (Gold)
  doc.text("UNNATI ARTS", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Fine Stone Craftsmanship", 105, 26, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(20, 30, 190, 30);

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("ADVANCE PAYMENT RECEIPT", 105, 45, { align: "center" });

  // Details
  doc.setFontSize(12);
  doc.text(`Receipt Date: ${new Date().toLocaleDateString('en-GB')}`, 20, 60);
  doc.text(`Project ID: ${project.projectId}`, 140, 60);
  
  doc.text(`Received From: ${project.clientName || 'N/A'}`, 20, 70);
  doc.text(`Contact: ${project.clientContact || 'N/A'}`, 20, 80);

  // Table
  autoTable(doc, {
    startY: 95,
    head: [['Description', 'Amount']],
    body: [
      [`Advance payment for Project: ${project.name}`, `Rs. ${advanceAmount.toLocaleString('en-IN')}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [26, 28, 41] }, // Dark header
    styles: { fontSize: 11, cellPadding: 5 }
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  doc.text("Authorized Signatory", 140, finalY);
  doc.setLineWidth(0.5);
  doc.line(140, finalY + 2, 185, finalY + 2);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("This is an auto-generated receipt.", 105, 280, { align: "center" });

  // Download
  doc.save(`Receipt_${project.projectId}.pdf`);
};

export const generateWorkOrderPDF = (project: any, advanceAmount: number) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(179, 139, 54);
  doc.text("UNNATI ARTS - WORK ORDER", 105, 20, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(20, 30, 190, 30);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Date Issued: ${new Date().toLocaleDateString('en-GB')}`, 20, 45);
  doc.text(`Work Order Ref: WO-${project.projectId.replace('PRJ-', '')}`, 140, 45);

  doc.text(`Client Name: ${project.clientName || 'N/A'}`, 20, 60);
  doc.text(`Project Name: ${project.name}`, 20, 70);
  doc.text(`Advance Received: Rs. ${advanceAmount.toLocaleString('en-IN')}`, 20, 80);

  autoTable(doc, {
    startY: 95,
    head: [['Task', 'Status']],
    body: [
      ['Shop Drawings & Design Approval', 'Completed'],
      ['Material Procurement', 'Pending'],
      ['Production & Carving', 'Pending'],
      ['QA & Dispatch', 'Pending']
    ],
    theme: 'striped',
    headStyles: { fillColor: [179, 139, 54] },
  });

  doc.text("Production Manager", 140, (doc as any).lastAutoTable.finalY + 40);
  doc.line(140, (doc as any).lastAutoTable.finalY + 42, 185, (doc as any).lastAutoTable.finalY + 42);

  doc.save(`WorkOrder_${project.projectId}.pdf`);
};

export const generateQuotationPDF = (project: any, products: any[], quoteDetails: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(179, 139, 54); // Gold #B38B36
  doc.text("UNNATI ARTS", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Fine Stone Craftsmanship & Custom Designs", 105, 26, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(20, 30, 190, 30);

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("PRODUCT ESTIMATION & QUOTATION", 105, 45, { align: "center" });

  // Details
  doc.setFontSize(11);
  doc.text(`Quotation Date: ${new Date().toLocaleDateString('en-GB')}`, 20, 60);
  doc.text(`Project ID: ${project.projectId}`, 140, 60);
  
  doc.text(`Client Name: ${project.clientName || 'N/A'}`, 20, 70);
  doc.text(`Project Name: ${project.name}`, 140, 70);
  doc.text(`Contact: ${project.clientContact || 'N/A'}`, 20, 80);

  // Products Table
  const tableBody = products.map(p => {
    const dimensionsStr = p.unit !== 'Pieces' 
      ? `${p.length || 0} x ${p.width || 0} x ${p.breadth || 0}`
      : '-';
    return [
      p.category || 'N/A',
      p.unit || 'N/A',
      dimensionsStr,
      p.qty || 0,
      `Rs. ${(p.rate || 0).toLocaleString('en-IN')}`,
      `Rs. ${(p.amount || 0).toLocaleString('en-IN')}`
    ];
  });

  autoTable(doc, {
    startY: 90,
    head: [['Category', 'Unit', 'Dimensions (L x W x B)', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [26, 28, 41] }, // Dark header
    styles: { fontSize: 10, cellPadding: 3 }
  });

  // Calculate totals
  const productsTotal = products.reduce((acc, p) => acc + (p.amount || 0), 0);
  
  // Additional Costs
  const additionalItems = [];
  if (quoteDetails.materialCost) additionalItems.push(['Material Cost', `Rs. ${quoteDetails.materialCost.toLocaleString('en-IN')}`]);
  if (quoteDetails.cncCost) additionalItems.push(['CNC Cutting Cost', `Rs. ${quoteDetails.cncCost.toLocaleString('en-IN')}`]);
  if (quoteDetails.handCarvingCost) additionalItems.push(['Hand Carving Cost', `Rs. ${quoteDetails.handCarvingCost.toLocaleString('en-IN')}`]);
  if (quoteDetails.inlayCost) additionalItems.push(['Inlay Cost', `Rs. ${quoteDetails.inlayCost.toLocaleString('en-IN')}`]);
  if (quoteDetails.polishingCost) additionalItems.push(['Polishing Cost', `Rs. ${quoteDetails.polishingCost.toLocaleString('en-IN')}`]);
  if (quoteDetails.packingCost) additionalItems.push(['Packing Cost', `Rs. ${quoteDetails.packingCost.toLocaleString('en-IN')}`]);
  if (quoteDetails.transportCost) additionalItems.push(['Transport Cost', `Rs. ${quoteDetails.transportCost.toLocaleString('en-IN')}`]);
  if (quoteDetails.installationCost) additionalItems.push(['Installation Cost', `Rs. ${quoteDetails.installationCost.toLocaleString('en-IN')}`]);

  const additionalTotal = (quoteDetails.materialCost || 0) + 
    (quoteDetails.cncCost || 0) + 
    (quoteDetails.handCarvingCost || 0) + 
    (quoteDetails.inlayCost || 0) + 
    (quoteDetails.polishingCost || 0) + 
    (quoteDetails.packingCost || 0) + 
    (quoteDetails.transportCost || 0) + 
    (quoteDetails.installationCost || 0);

  const grandTotal = productsTotal + additionalTotal;

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // Render Additional Costs table if they exist
  if (additionalItems.length > 0) {
    doc.setFontSize(12);
    doc.text("Additional Costs Breakdown:", 20, currentY);
    
    autoTable(doc, {
      startY: currentY + 4,
      head: [['Cost Component', 'Amount']],
      body: additionalItems,
      theme: 'grid',
      headStyles: { fillColor: [179, 139, 54] },
      styles: { fontSize: 10, cellPadding: 3 }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Grand Total Summary Box
  doc.setFillColor(247, 243, 235); // Light Gold/Cream background
  doc.rect(20, currentY, 170, 30, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Total Products Amount: Rs. ${productsTotal.toLocaleString('en-IN')}`, 25, currentY + 10);
  doc.text(`Total Additional Costs: Rs. ${additionalTotal.toLocaleString('en-IN')}`, 25, currentY + 18);
  
  doc.setFontSize(13);
  doc.setTextColor(179, 139, 54); // Gold
  doc.setFont("helvetica", "bold");
  doc.text(`Estimated Grand Total: Rs. ${grandTotal.toLocaleString('en-IN')}`, 25, currentY + 26);
  doc.setFont("helvetica", "normal");
  
  // Footer signature
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Authorized Signature", 140, currentY + 50);
  doc.line(140, currentY + 52, 185, currentY + 52);
  
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("This is a computer generated quote.", 105, 280, { align: "center" });

  doc.save(`Quotation_${project.projectId}.pdf`);
};

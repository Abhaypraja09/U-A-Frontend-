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
  doc.text(`Work Order Ref: WO-${project.projectId}`, 140, 45);

  doc.text(`Client Name: ${project.clientName || 'N/A'}`, 20, 60);
  doc.text(`Project Name: ${project.name}`, 20, 70);
  doc.text(`Advance Received: Rs. ${advanceAmount.toLocaleString('en-IN')}`, 20, 80);

  autoTable(doc, {
    startY: 95,
    head: [['Task', 'Status']],
    body: [
      ['Shop Drawings & Design Approval', 'Pending'],
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

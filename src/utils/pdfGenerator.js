import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export const generatePDF = async (bill) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 14;
  const rightMargin = pageWidth - 14;
  const contentWidth = pageWidth - (2 * leftMargin);
  
  if (bill.status === 'CANCELLED') {
    doc.setTextColor(255, 0, 0);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.3 }));
    doc.text("CANCELLED", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();
  }
  doc.setTextColor(0);
  
  // Header
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("SUBJECT TO THANE JURISDICTION", pageWidth / 2, 7, { align: 'center' });
  const textWidth = doc.getTextWidth("SUBJECT TO THANE JURISDICTION");
  const startX = (pageWidth - textWidth) / 2;
  doc.setLineWidth(0.3); doc.line(startX, 8, startX + textWidth, 8); 

  doc.setFontSize(27); doc.setFont("times", "bold"); 
  doc.text("MARUTI JEWELLERS", pageWidth / 2, 18, { align: 'center' }); 
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("02, Ratnadeep CHS, Navghar Road, Bhayander East, Thane - 401 105", pageWidth / 2, 24, { align: 'center' });
  doc.text("GSTIN: 27AAAPJ6532C1Z5  |  PAN: AAAPJ6532C", pageWidth / 2, 29, { align: 'center' });
  doc.text("Mob: 9029136249", pageWidth / 2, 34, { align: 'center' });

  const headerBottomY = 37; const headerHeight = 7;
  doc.setLineWidth(0.5); doc.setDrawColor(0);
  doc.rect(leftMargin, headerBottomY, contentWidth, headerHeight);
  doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text("Tax Invoice", pageWidth / 2, headerBottomY + 5, { align: 'center' });

  // Customer Details
  const detailsTopY = headerBottomY + headerHeight;
  const detailsHeight = 38; 
  doc.rect(leftMargin, detailsTopY, contentWidth, detailsHeight);
  doc.line(pageWidth / 2 + 10, detailsTopY, pageWidth / 2 + 10, detailsTopY + detailsHeight);

  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER DETAILS:", leftMargin + 2, detailsTopY + 5);
  doc.setFont("helvetica", "normal");
  
  const labelX = leftMargin + 2;
  const valX = leftMargin + 27; 
  let currentY = detailsTopY + 10;
  
  doc.text("NAME", labelX, currentY); doc.text(`:  ${bill.customer.name}`, valX, currentY);
  currentY += 5;
  doc.text("PHONE NO", labelX, currentY); doc.text(`:  ${bill.customer.phone}`, valX, currentY);
  currentY += 5;
  
  // ADDRESS FIX
  doc.text("ADDRESS", labelX, currentY); doc.text(":", valX, currentY);
  const addressLines = doc.splitTextToSize(bill.customer.address || "", 70);
  doc.text(addressLines, valX + 3, currentY);
  currentY += (addressLines.length * 4) + 1; 

  doc.text("GSTIN", labelX, currentY); doc.text(`:  ${bill.customer.gstin || '-'}`, valX, currentY);

  // Right Col
  const rightColX = pageWidth / 2 + 12;
  const rightValX = rightColX + 28;
  currentY = detailsTopY + 10; 
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString('en-IN');
  };
  doc.text("INVOICE DATE", rightColX, currentY); doc.text(`:  ${formatDate(bill.invoiceDate)}`, rightValX, currentY);
  currentY += 5;
  doc.text("INVOICE NO", rightColX, currentY); doc.text(`:  ${bill.invoiceNo}`, rightValX, currentY);
  currentY += 5;
  doc.text("ORDER DATE", rightColX, currentY); doc.text(`:  ${formatDate(bill.orderDate)}`, rightValX, currentY);

  // Table
  const tableTopY = detailsTopY + detailsHeight;
  const tableBottomY = 175; 
  const tableBody = bill.items.map((item, index) => [
    index + 1, item.particulars, item.purity || "-",
    parseFloat(item.grossWeight || 0).toFixed(3),
    parseFloat(item.netWeight || 0).toFixed(3),
    item.rate, item.amount 
  ]);

  autoTable(doc, {
    startY: tableTopY,
    head: [['Sr No.', 'Particulars', 'Purity', 'Gross Wt.', 'Net Wt.', 'Rate', 'Amount']],
    body: tableBody,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2, textColor: 0, valign: 'top', lineWidth: 0 },
    headStyles: { fontStyle: 'bold', fillColor: [235, 235, 235], lineWidth: 0.5, lineColor: 0, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' }, 5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: leftMargin },
    didDrawCell: (data) => {
      doc.setDrawColor(0); doc.setLineWidth(0.5);
      doc.line(data.cell.x + data.cell.width, tableTopY, data.cell.x + data.cell.width, tableBottomY);
      if (data.column.index === 0) doc.line(data.cell.x, tableTopY, data.cell.x, tableBottomY);
    }
  });
  doc.line(leftMargin, tableBottomY, rightMargin, tableBottomY);

  // Totals
  const totalsTopY = tableBottomY;
  const rowHeight = 7;
  const totalsBottomY = totalsTopY + (rowHeight * 4);
  const totalsBoxX = 135; 

  doc.line(leftMargin, totalsTopY, leftMargin, totalsBottomY);
  doc.line(totalsBoxX, totalsTopY, totalsBoxX, totalsBottomY);
  doc.line(rightMargin, totalsTopY, rightMargin, totalsBottomY);

  // Words - OVERLAP FIX
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("Amount in words:", leftMargin + 2, totalsTopY + 6);
  doc.setFont("helvetica", "italic");
  // REDUCED WIDTH TO 80mm to avoid collision with Taxable Value
  const wrappedWords = doc.splitTextToSize(bill.amountInWords || "", 80); 
  doc.text(wrappedWords, leftMargin + 35, totalsTopY + 6);
  const wordsHeight = wrappedWords.length * 4; 
  
  doc.setFont("helvetica", "normal");
  const paymentY = totalsTopY + 6 + wordsHeight + 4;
  doc.text("Mode of payment:", leftMargin + 2, paymentY);
  doc.text(`${bill.paymentMode || '-'}`, leftMargin + 35, paymentY);

  // Numbers
  const totalValX = rightMargin - 2;
  doc.text("TAXABLE VALUE", totalsBoxX + 2, totalsTopY + 5);
  doc.text(`${bill.taxableValue}`, totalValX, totalsTopY + 5, { align: 'right' });
  doc.text("CGST 1.5%", totalsBoxX + 2, totalsTopY + rowHeight + 5);
  doc.text(`${bill.cgstAmount}`, totalValX, totalsTopY + rowHeight + 5, { align: 'right' });
  doc.text("SGST 1.5%", totalsBoxX + 2, totalsTopY + (rowHeight * 2) + 5);
  doc.text(`${bill.sgstAmount}`, totalValX, totalsTopY + (rowHeight * 2) + 5, { align: 'right' });

  const grandTotalTopY = totalsTopY + (rowHeight * 3);
  doc.line(totalsBoxX, grandTotalTopY, rightMargin, grandTotalTopY);
  doc.line(leftMargin, totalsBottomY, rightMargin, totalsBottomY); 
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", totalsBoxX + 2, grandTotalTopY + 5);
  doc.text(`${bill.grandTotal}`, totalValX, grandTotalTopY + 5, { align: 'right' });

  // Footer
  const boxTopY = totalsBottomY; 
  const boxBottomY = boxTopY + 35; 
  doc.line(leftMargin, boxBottomY, rightMargin, boxBottomY); 
  doc.line(leftMargin, boxTopY, leftMargin, boxBottomY);     
  doc.line(rightMargin, boxTopY, rightMargin, boxBottomY);   

  const div1X = leftMargin + 85; 
  doc.line(div1X, boxTopY, div1X, boxBottomY);
  const div2X = pageWidth - 65;
  doc.line(div2X, boxTopY, div2X, boxBottomY);

doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Declaration:", leftMargin + 2, boxTopY + 4);
  
  // 2. Body Text: Set to NORMAL (Removes boldness as requested)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const declarationText1 = "The purity of the ornament has been verified and accepted by the customer at the time of sale.";
  const declarationText2 = "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";

  // 3. Set Width to 83mm (Touches the right line)
  const wrappedDecl1 = doc.splitTextToSize(declarationText1, 83);
  const wrappedDecl2 = doc.splitTextToSize(declarationText2, 83);

  // 4. Print with manual spacing so they look neat
  doc.text(wrappedDecl1, leftMargin + 2, boxTopY + 9);
  doc.text(wrappedDecl2, leftMargin + 2, boxTopY + 16);
  // QR
  const qrUrl = `https://marutijewels.netlify.app/verify/${bill._id}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl);
  const midBoxWidth = div2X - div1X;
  const qrSize = 25;
  const qrX = div1X + (midBoxWidth - qrSize) / 2;
  const qrY = boxTopY + (35 - qrSize) / 2;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  // Sign
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("for Maruti Jewellers", rightMargin - 2, boxTopY + 5, { align: 'right' });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text("Authorised Signatory", rightMargin - 2, boxBottomY - 2, { align: 'right' });
  
  doc.setFontSize(7);
  doc.text("This is a computer generated invoice", pageWidth / 2, boxBottomY + 5, { align: 'center' });

  doc.save(`Invoice_${bill.invoiceNo}.pdf`);
};
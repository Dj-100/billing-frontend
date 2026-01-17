import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export const generatePDF = async (bill) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- CONFIGURATION ---
  const leftMargin = 14;
  const rightMargin = pageWidth - 14;
  const contentWidth = pageWidth - (2 * leftMargin);
  
  // --- 0. CANCELLED WATERMARK ---
  if (bill.status === 'CANCELLED') {
    doc.setTextColor(255, 0, 0);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.3 }));
    doc.text("CANCELLED", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();
  }

  // --- 1. TOP HEADER ---
  doc.setTextColor(0);
  
  // Jurisdiction
  doc.setFontSize(8); 
  doc.setFont("helvetica", "normal");
  doc.text("SUBJECT TO THANE JURISDICTION", pageWidth / 2, 7, { align: 'center' });

  // Store Name
  doc.setFontSize(26); 
  doc.setFont("times", "bold"); 
  doc.text("MARUTI JEWELLERS", pageWidth / 2, 18, { align: 'center' });

  // Address
  doc.setFontSize(10); 
  doc.setFont("helvetica", "normal");
  doc.text("02, Ratnadeep CHS, Navghar Road, Bhayander East, Thane - 401 105", pageWidth / 2, 24, { align: 'center' });
  doc.text("GSTIN: 27AAAPJ6532C1Z5  |  PAN: AAAPJ6532C", pageWidth / 2, 29, { align: 'center' });
  doc.text("Mob: 9029136249", pageWidth / 2, 34, { align: 'center' });

  // --- 2. TAX INVOICE STRIP ---
  const headerBottomY = 37; 
  const headerHeight = 7;
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(0);
  
  // Draw Box around "Tax Invoice"
  doc.rect(leftMargin, headerBottomY, contentWidth, headerHeight);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Tax Invoice", pageWidth / 2, headerBottomY + 5, { align: 'center' });

  // --- 3. CUSTOMER & INVOICE DETAILS ---
  const detailsTopY = headerBottomY + headerHeight;
  const detailsHeight = 28; 
  const detailsBottomY = detailsTopY + detailsHeight;
  
  // Draw Box around Customer Details
  doc.rect(leftMargin, detailsTopY, contentWidth, detailsHeight);
  
  // Vertical Divider Line (Middle of details box)
  doc.line(pageWidth / 2 + 10, detailsTopY, pageWidth / 2 + 10, detailsBottomY);

  // Left Side (Customer)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER DETAILS:", leftMargin + 2, detailsTopY + 5);
  
  doc.setFont("helvetica", "normal");
  const labelX = leftMargin + 2;
  const valX = leftMargin + 27; 
  let currentY = detailsTopY + 10;
  
  doc.text("NAME", labelX, currentY); doc.text(`:  ${bill.customer.name}`, valX, currentY);
  currentY += 5;
  doc.text("PHONE NO", labelX, currentY); doc.text(`:  ${bill.customer.phone}`, valX, currentY);
  currentY += 5;
  doc.text("ADDRESS", labelX, currentY); doc.text(`:  ${bill.customer.address}`, valX, currentY);
  currentY += 5;
  doc.text("GSTIN", labelX, currentY); doc.text(`:  ${bill.customer.gstin || '-'}`, valX, currentY);

  // Right Side (Invoice Info)
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

  // --- 4. THE TABLE ---
  const tableTopY = detailsBottomY;
  
  // UI CONTROL: "tableBottomY" decides where the grid lines STOP. 
  const tableBottomY = 175; 

  const tableBody = bill.items.map((item, index) => [
    index + 1,
    item.particulars,
    item.purity || "-",
    item.grossWeight,
    item.netWeight,
    item.rate,
    item.amount
  ]);

  autoTable(doc, {
    startY: tableTopY,
    head: [['Sr No.', 'Particulars', 'Purity', 'Gross Wt.', 'Net Wt.', 'Rate', 'Amount']],
    body: tableBody,
    theme: 'plain',
    styles: { 
      fontSize: 9, 
      cellPadding: 2, 
      textColor: 0,
      valign: 'top', 
      lineWidth: 0,
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [235, 235, 235],
      lineWidth: 0.5,
      lineColor: 0,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: leftMargin },
    
    // Custom Line Drawing to create the grid effect
    didDrawCell: (data) => {
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      
      // Right vertical line for every cell
      doc.line(data.cell.x + data.cell.width, tableTopY, data.cell.x + data.cell.width, tableBottomY);
      
      // Left vertical line (only for first column)
      if (data.column.index === 0) {
        doc.line(data.cell.x, tableTopY, data.cell.x, tableBottomY);
      }
    }
  });

  // Draw Bottom Horizontal Line of Table
  doc.line(leftMargin, tableBottomY, rightMargin, tableBottomY);

  // --- 5. TOTALS SECTION ---
  const totalsTopY = tableBottomY;
  
  // UI CONTROL: "rowHeight" adjusts spacing between Taxable, CGST, SGST
  const rowHeight = 7;
  const totalBoxHeight = rowHeight * 4; // Taxable + CGST + SGST + TOTAL
  const totalsBottomY = totalsTopY + totalBoxHeight;
  
  const totalsBoxX = 135; 

  // --- VERTICAL LINES FOR TOTALS SECTION ---
  
  // 1. Far Left Line (ADDED THIS) - Closes the box on the left
  doc.line(leftMargin, totalsTopY, leftMargin, totalsBottomY);

  // 2. Middle Line (Separates Words from Numbers)
  doc.line(totalsBoxX, totalsTopY, totalsBoxX, totalsBottomY);
  
  // 3. Far Right Line - Closes the box on the right
  doc.line(rightMargin, totalsTopY, rightMargin, totalsBottomY);

  // -- LEFT SIDE CONTENT --
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Amount in words:", leftMargin + 2, totalsTopY + 6);
  
  doc.setFont("helvetica", "italic");
  const wrappedText = doc.splitTextToSize(bill.amountInWords || "", 110);
  doc.text(wrappedText, leftMargin + 30, totalsTopY + 6);
  
  doc.setFont("helvetica", "normal");
  doc.text("Mode of payment:", leftMargin + 2, totalsTopY + 22);
  doc.text(`${bill.paymentMode || '-'}`, leftMargin + 30, totalsTopY + 22);

  // -- RIGHT SIDE CONTENT --
  const totalValX = rightMargin - 2;

  // 1. Taxable Value
  doc.text("TAXABLE VALUE", totalsBoxX + 2, totalsTopY + 5);
  doc.text(`${bill.taxableValue}`, totalValX, totalsTopY + 5, { align: 'right' });
  
  // 2. CGST
  doc.text("CGST 1.5%", totalsBoxX + 2, totalsTopY + rowHeight + 5);
  doc.text(`${bill.cgstAmount}`, totalValX, totalsTopY + rowHeight + 5, { align: 'right' });

  // 3. SGST
  doc.text("SGST 1.5%", totalsBoxX + 2, totalsTopY + (rowHeight * 2) + 5);
  doc.text(`${bill.sgstAmount}`, totalValX, totalsTopY + (rowHeight * 2) + 5, { align: 'right' });

  // 4. GRAND TOTAL
  const grandTotalTopY = totalsTopY + (rowHeight * 3);
  
  // Line above TOTAL (inside the totals box only)
  doc.line(totalsBoxX, grandTotalTopY, rightMargin, grandTotalTopY);
  
  // Line below TOTAL (The very bottom line of the totals section)
  doc.line(leftMargin, totalsBottomY, rightMargin, totalsBottomY); 

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", totalsBoxX + 2, grandTotalTopY + 5);
  doc.text(`${bill.grandTotal}`, totalValX, grandTotalTopY + 5, { align: 'right' });


  // --- 6. FOOTER GRID (Declaration | QR | Sign) ---
  const boxTopY = totalsBottomY; 
  // UI CONTROL: "boxBottomY" sets the final bottom edge of the footer box
  const boxBottomY = boxTopY + 35; 
  
  // Draw Box Outline (Left, Right, Bottom)
  doc.line(leftMargin, boxBottomY, rightMargin, boxBottomY); // Bottom
  doc.line(leftMargin, boxTopY, leftMargin, boxBottomY);     // Left
  doc.line(rightMargin, boxTopY, rightMargin, boxBottomY);   // Right

  // Vertical Divider 1 (Declaration | QR)
  // UI CONTROL: Adjust "85" to change width of Declaration column
  const div1X = leftMargin + 85;
  doc.line(div1X, boxTopY, div1X, boxBottomY);

  // Vertical Divider 2 (QR | Sign)
  // UI CONTROL: Adjust "65" to change width of Signature column
  const div2X = pageWidth - 65;
  doc.line(div2X, boxTopY, div2X, boxBottomY);

  // -- COL 1: DECLARATION --
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Declaration:", leftMargin + 2, boxTopY + 4);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("• The purity of the ornament have been verified and", leftMargin + 2, boxTopY + 9);
  doc.text("  accepted by the customer at the time of sale.", leftMargin + 4, boxTopY + 13);
  doc.text("• We declare that this invoice show the actual price", leftMargin + 2, boxTopY + 18);
  doc.text("  of the goods described and that all particulars are", leftMargin + 4, boxTopY + 22);
  doc.text("  true and correct.", leftMargin + 4, boxTopY + 26);

  // -- COL 2: QR CODE --
  // Use local IP for testing or production URL
  // CHANGE THIS TO THE NETLIFY LINK
  const qrUrl = `https://marutijewels.netlify.app/verify/${bill._id}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl);
  
  const midBoxWidth = div2X - div1X;
  const qrSize = 25;
  const qrX = div1X + (midBoxWidth - qrSize) / 2;
  const qrY = boxTopY + (35 - qrSize) / 2;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  // -- COL 3: SIGNATURE --
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("for Maruti Jewellers", rightMargin - 2, boxTopY + 5, { align: 'right' });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Authorised Signatory", rightMargin - 2, boxBottomY - 2, { align: 'right' });

  // --- 7. BOTTOM TEXT ---
  doc.setFontSize(7);
  doc.text("This is a computer generated invoice", pageWidth / 2, boxBottomY + 5, { align: 'center' });

  doc.save(`Invoice_${bill.invoiceNo}.pdf`);
};
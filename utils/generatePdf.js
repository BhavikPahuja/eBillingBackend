const PDFDocument = require('pdfkit');

function formatINR(num) {
  return "₹ " + Number(num).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function generatePdf(billData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Colors and fonts matching your styles
      const primaryColor = '#1976d2';     // Blue used in header and accents
      const borderColor = '#b0bec5';      // Border grey
      const tableHeaderBg = '#e3eafc';    // Light blue header bg
      const tableBodyBg = '#fafbfc';      // Lightest blue row bg
      const footerBg = '#f0f4ff';         // Footer total bg
      const textFont = 'Helvetica';

      // -- Header Section --
      doc.fillColor(primaryColor)
        .font(textFont)
        .fontSize(30)
        .text('Mobile Shop Mirzewala', 40, 40, { lineGap: 6, characterSpacing: 2 });

      doc.fillColor('black')
        .fontSize(12)
        .text(billData.address || '', 40, 85);

      // Horizontal line under header (2px solid #1976d2)
      doc.moveTo(40, 110)
        .lineTo(555, 110)
        .lineWidth(2)
        .strokeColor(primaryColor)
        .stroke();

      // -- Customer and Invoice Info --
      const infoY = 120;

      // Bill To left
      doc.fillColor('black')
        .fontSize(12)
        .font(textFont)
        .text(`Bill To: ${billData.companyName || ""}`, 40, infoY)
        .text(`Contact No.: ${billData.contactNo || ""}`, 40, infoY + 18);

      // Invoice No and Date right
      doc.text(`Invoice No: ${billData.invoiceNo || ""}`, 350, infoY)
        .text(`Date: ${billData.date || ""}`, 350, infoY + 18);

      // -- Invoice Details Title --
      doc.fillColor('#333')
        .fontSize(16)
        .text('Invoice Details', 40, infoY + 60);

      // -- Table setup --
      const tableTop = infoY + 90;
      const itemColX = [40, 80, 300, 390, 480];
      const rowHeight = 30;

      // Table Header background
      doc.rect(40, tableTop, 515, rowHeight)
        .fill(tableHeaderBg);

      // Header Text
      doc.fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold');

      const headers = ['#', 'Item Name', 'Quantity', 'Price / Unit', 'Amount'];
      headers.forEach((header, i) => {
        doc.text(header, itemColX[i] + 5, tableTop + 8);
      });

      // Draw header borders
      doc.lineWidth(1).strokeColor(borderColor);
      doc.rect(40, tableTop, 515, rowHeight).stroke();
      for (let x of itemColX.slice(1)) {
        doc.moveTo(x, tableTop).lineTo(x, tableTop + rowHeight).stroke();
      }

      // -- Table body rows --
      doc.font('Helvetica').fillColor('black').fontSize(12);
      let currentY = tableTop + rowHeight;

      (billData.items || []).forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(40, currentY, 515, rowHeight).fill(tableBodyBg);
        }

        // Row borders
        doc.rect(40, currentY, 515, rowHeight).stroke();
        for (let x of itemColX.slice(1)) {
          doc.moveTo(x, currentY).lineTo(x, currentY + rowHeight).stroke();
        }

        // Item data
        doc.fillColor('black');
        doc.text(index + 1, itemColX[0] + 5, currentY + 8);
        doc.text(item.name, itemColX[1] + 5, currentY + 8);
        doc.text(item.quantity.toString(), itemColX[2] + 5, currentY + 8);
        doc.text(formatINR(item.price), itemColX[3] + 5, currentY + 8);
        doc.text(formatINR(item.quantity * item.price), itemColX[4] + 5, currentY + 8);

        currentY += rowHeight;
      });

      // -- Table footer with total --
      doc.rect(40, currentY, 515, rowHeight)
        .fill(footerBg);
      doc.rect(40, currentY, 515, rowHeight)
        .stroke();

      for (let x of itemColX.slice(1)) {
        doc.moveTo(x, currentY).lineTo(x, currentY + rowHeight).stroke();
      }

      doc.font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('Total', itemColX[3] + 5, currentY + 8);
      doc.text(formatINR(billData.totalAmount), itemColX[4] + 5, currentY + 8);

      currentY += rowHeight + 10;

      // -- Amount in words --
      doc.font('Helvetica-Oblique')
        .fillColor('#444')
        .fontSize(12)
        .text(`Invoice Amount in Words: ${billData.amountInWords || ""}`, 40, currentY);

      // -- Summary table on right side --
      const summaryX = 320;
      let summaryY = currentY + 40;
      const summaryLineHeight = 20;

      const summaryData = [
        ['Sub Total:', formatINR(billData.subTotal || billData.totalAmount)],
        ['Total:', formatINR(billData.totalAmount)],
        ['Received:', formatINR(billData.received || 0)],
        ['Balance:', formatINR(billData.balance || 0)],
        ['Current Balance:', formatINR(billData.currentBalance || 0)],
      ];

      doc.font('Helvetica').fillColor('black').fontSize(12);
      summaryData.forEach(([label, value], i) => {
        doc.text(label, summaryX, summaryY + i * summaryLineHeight);
        doc.text(value, summaryX + 120, summaryY + i * summaryLineHeight);
      });

      // -- Footer message --
      doc.fillColor(primaryColor)
        .font('Helvetica-Oblique')
        .fontSize(14)
        .text('Thank you for doing business with us.', 40, 760, {
          width: 515,
          align: 'left',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generatePdf;
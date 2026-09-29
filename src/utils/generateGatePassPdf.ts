import { jsPDF } from 'jspdf';
import { SlotBooking } from '../types/procurement';

export interface GeneratePdfOptions {
  paperSize?: 'a4' | 'thermal_80mm';
  centerCode?: string;
  operatorName?: string;
  operatorId?: string;
}

// Generates a 25x25 QR matrix deterministically for vector drawing onto PDF
function getQrMatrix(text: string): boolean[][] {
  const gridSize = 25;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const grid: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
  let seed = Math.abs(hash) || 123456789;
  const nextRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isTopLeftFinder = r < 7 && c < 7;
      const isTopRightFinder = r < 7 && c >= gridSize - 7;
      const isBottomLeftFinder = r >= gridSize - 7 && c < 7;
      const isAlignment = r >= gridSize - 9 && r <= gridSize - 5 && c >= gridSize - 9 && c <= gridSize - 5;

      if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder || isAlignment) {
        continue;
      }

      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0;
        continue;
      }

      grid[r][c] = nextRandom() > 0.48;
    }
  }

  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          grid[startR + r][startC + c] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          grid[startR + r][startC + c] = true;
        } else {
          grid[startR + r][startC + c] = false;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  return grid;
}

/**
 * Generates an official, print-friendly Government of India / FCI Gate Pass PDF
 */
export function generateGatePassPdf(
  booking: SlotBooking,
  options: GeneratePdfOptions = {}
): jsPDF {
  const {
    paperSize = 'a4',
    centerCode = 'APMC-KRN-04',
    operatorName = 'Gurmeet Singh',
    operatorId = 'CSC-HR-KRN-104'
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperSize === 'thermal_80mm' ? [80, 220] : 'a4'
  });

  if (paperSize === 'thermal_80mm') {
    // Thermal receipt style (80mm width)
    generateThermalReceipt(doc, booking, { centerCode, operatorName, operatorId });
  } else {
    // Standard A4 official government slip
    generateStandardA4Pass(doc, booking, { centerCode, operatorName, operatorId });
  }

  return doc;
}

function generateStandardA4Pass(
  doc: jsPDF, 
  booking: SlotBooking,
  meta: { centerCode: string; operatorName: string; operatorId: string }
) {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Outer decorative security border
  doc.setDrawColor(20, 83, 45); // Emerald-900
  doc.setLineWidth(1.2);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.rect(margin + 1.5, margin + 1.5, contentWidth - 3, pageHeight - margin * 2 - 3);

  // Top National Emblem Header Strip
  doc.setFillColor(20, 83, 45);
  doc.rect(margin, margin, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GOVERNMENT OF INDIA · DEPARTMENT OF CONSUMER AFFAIRS', pageWidth / 2, margin + 7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('FOOD CORPORATION OF INDIA (FCI) · APMC CENTRAL PROCUREMENT DIVISION', pageWidth / 2, margin + 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OFFICIAL MANDI VEHICLE ENTRY PASS & QUEUE TOKEN', pageWidth / 2, margin + 19, { align: 'center' });

  // Center & Document Meta Subheader
  let y = margin + 30;
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(booking.centerName.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Center Code: ${meta.centerCode}  |  Issuing Station: Taraori Rural CSC Kiosk  |  Date: ${booking.bookingDate}`, pageWidth / 2, y, { align: 'center' });

  // Token & Gate Highlight Hero Card
  y += 6;
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(margin + 4, y, contentWidth - 8, 32, 3, 3, 'FD');

  // Token Box (Left)
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL TOKEN NUMBER', margin + 10, y + 8);

  doc.setTextColor(20, 83, 45);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.tokenNumber, margin + 10, y + 17);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Aadhaar Ref: XXXX-XXXX-${booking.aadhaarLast4}`, margin + 10, y + 24);

  // Gate Box (Center)
  const gateX = margin + (contentWidth / 2) - 10;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSIGNED MANDI ENTRY GATE', gateX, y + 8);

  doc.setTextColor(180, 83, 9); // Amber-700
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`GATE #${booking.gateNumber}`, gateX, y + 17);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Tractor & Trailer Fast-Track Lane', gateX, y + 24);

  // Scheduled Time Window (Right)
  const timeX = margin + contentWidth - 58;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTING TIME WINDOW', timeX, y + 8);

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.timeSlot, timeX, y + 16);

  doc.setTextColor(220, 38, 38); // Red warning
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ARRIVE 15 MINS PRIOR', timeX, y + 24);

  // Middle Section: 2D Barcode / QR Code & Farmer Particulars
  y += 38;

  // Vector QR Code on Left
  const qrX = margin + 8;
  const qrY = y;
  const qrSize = 52;
  const qrText = `DOCA-PASS:${booking.tokenNumber}:${booking.gateNumber}:${booking.vehicleNumber}:${booking.centerId}`;
  const matrix = getQrMatrix(qrText);
  const cellSize = qrSize / matrix.length;

  doc.setFillColor(255, 255, 255);
  doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 'F');
  doc.setFillColor(0, 0, 0);

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (matrix[r][c]) {
        doc.rect(qrX + c * cellSize, qrY + r * cellSize, cellSize + 0.1, cellSize + 0.1, 'F');
      }
    }
  }

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('OPTICAL 2D GATE BARCODE', qrX + qrSize / 2, qrY + qrSize + 4.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Present to Boom Barrier Laser Scanner', qrX + qrSize / 2, qrY + qrSize + 8, { align: 'center' });

  // Particulars Table on Right
  const tableX = margin + 68;
  const tableW = contentWidth - 76;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);

  const particulars = [
    { label: 'Farmer Full Name', value: booking.farmerName },
    { label: 'Registered Mobile No.', value: booking.farmerPhone },
    { label: 'Registered Vehicle No.', value: `${booking.vehicleNumber} (${booking.vehicleType})` },
    { label: 'Commodity to Procure', value: `${booking.cropName}` },
    { label: 'Estimated Lot Volume', value: `${booking.estimatedWeightQtl} Quintals (~${booking.bagsCount} Standard Bags)` },
    { label: 'Approved MSP Benchmark', value: `Rs. ${booking.mspRate.toLocaleString('en-IN')} / Quintal` },
    { label: 'Estimated Gross Payout', value: `Rs. ${(booking.estimatedWeightQtl * booking.mspRate).toLocaleString('en-IN')} (Direct DBT via PFMS)` },
    { label: 'Kiosk Verification Code', value: `${booking.tokenNumber}-VERIFIED` }
  ];

  let rowY = y;
  doc.setFontSize(8);
  particulars.forEach((item, idx) => {
    // Zebra striping
    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(tableX, rowY, tableW, 6.5, 'F');
    }
    doc.line(tableX, rowY + 6.5, tableX + tableW, rowY + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text(item.label, tableX + 2, rowY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(String(item.value), tableX + tableW - 2, rowY + 4.5, { align: 'right' });

    rowY += 6.5;
  });

  // Mandatory Farmer Instructions & Legal Declaration (Hindi & English)
  y = rowY + 8;
  doc.setFillColor(254, 243, 199); // Amber-50
  doc.setDrawColor(245, 158, 11); // Amber-500
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 4, y, contentWidth - 8, 38, 2, 2, 'FD');

  doc.setTextColor(146, 64, 14); // Amber-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('MANDATORY INSTRUCTIONS FOR FARMER / VEHICLE DRIVER (महत्वपूर्ण किसान निर्देश)', margin + 8, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);

  const instructions = [
    '1. कृपया अपने निर्धारित समय से 15 मिनट पूर्व गेट नंबर पर पहुंचे और बूम बैरियर पर यह क्यूआर पास दिखाएं।',
    '   (Please arrive 15 minutes prior to scheduled slot at designated gate and scan this QR pass at the boom barrier.)',
    '2. वाहन में अनाज FAQ (Fair Average Quality) मानकों के अनुरूप लाएं (अधिकतम नमी: 12.0% - 14.0%)।',
    '   (Ensure grain meets Fair Average Quality moisture specifications not exceeding standard APMC threshold).',
    '3. इलेक्ट्रॉनिक धर्मकांटा वजन व ई-पावती (GRN) जारी होने के उपरांत PFMS द्वारा सीधा बैंक भुगतान किया जाएगा।',
    '   (Direct PFMS payout will be credited to your Aadhaar-linked bank account within 24-48 hours after weighment).'
  ];

  let instY = y + 11;
  instructions.forEach(inst => {
    doc.text(inst, margin + 8, instY);
    instY += 4.5;
  });

  // Operator Verification & Signature Sign-off Box
  y += 44;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  // Left Stamp Box: CSC Operator
  doc.rect(margin + 4, y, (contentWidth - 12) / 2, 26);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('CSC KIOSK OPERATOR CERTIFICATION', margin + 8, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issued By: ${meta.operatorName} (${meta.operatorId})`, margin + 8, y + 10);
  doc.text(`Gram Panchayat: Taraori Rural, Karnal`, margin + 8, y + 14);
  doc.text('Stamp: [CSC DIGITAL KIOSK VERIFIED - ZERO FEE]', margin + 8, y + 18);
  doc.text(`Timestamp: ${new Date().toLocaleString('en-IN')}`, margin + 8, y + 22);

  // Right Sign Box: Mandi Official / Weighbridge In-charge
  const rightBoxX = margin + 4 + (contentWidth - 12) / 2 + 4;
  doc.rect(rightBoxX, y, (contentWidth - 12) / 2, 26);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('APMC WEIGHBRIDGE & PHYSICAL GATE SIGN-OFF', rightBoxX + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Gate Security Officer Signature: _______________________', rightBoxX + 4, y + 12);
  doc.text('Weighbridge Tare Gross Inspector: _____________________', rightBoxX + 4, y + 18);
  doc.text('Vehicle Inspection Bay Seal: [PENDING AT MANDI ARRIVAL]', rightBoxX + 4, y + 23);

  // Bottom Footer Legal Strip
  const footerY = pageHeight - margin - 5;
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'National Agriculture Procurement System · KrishiSetu · Helpline: 1800-180-DOCA (Toll Free) · Kisan Call Center: 1551',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
}

function generateThermalReceipt(
  doc: jsPDF,
  booking: SlotBooking,
  meta: { centerCode: string; operatorName: string; operatorId: string }
) {
  const pageWidth = 80;
  let y = 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DEPARTMENT OF CONSUMER AFFAIRS', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.text('KRISHISETU MANDI GATE PASS', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(booking.centerName, pageWidth / 2, y, { align: 'center' });
  y += 3;
  doc.text(`Center: ${meta.centerCode} | Date: ${booking.bookingDate}`, pageWidth / 2, y, { align: 'center' });

  // Dashed separator
  y += 3;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, pageWidth - 6, y);
  doc.setLineDashPattern([], 0);

  // Big Token & Gate
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(booking.tokenNumber, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(12);
  doc.text(`GATE #${booking.gateNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.text(`Slot: ${booking.timeSlot}`, pageWidth / 2, y, { align: 'center' });

  // QR Code
  y += 4;
  const qrX = 17;
  const qrSize = 46;
  const matrix = getQrMatrix(`DOCA-PASS:${booking.tokenNumber}:${booking.gateNumber}`);
  const cellSize = qrSize / matrix.length;

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (matrix[r][c]) {
        doc.rect(qrX + c * cellSize, y + r * cellSize, cellSize + 0.1, cellSize + 0.1, 'F');
      }
    }
  }

  y += qrSize + 5;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, pageWidth - 6, y);
  doc.setLineDashPattern([], 0);

  // Details
  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const addRow = (l: string, v: string) => {
    doc.text(l, 8, y);
    doc.setFont('helvetica', 'bold');
    doc.text(v, pageWidth - 8, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 4;
  };

  addRow('Farmer:', booking.farmerName);
  addRow('Phone:', booking.farmerPhone);
  addRow('Vehicle:', booking.vehicleNumber);
  addRow('Crop:', booking.cropName);
  addRow('Est. Qtl:', `${booking.estimatedWeightQtl} Qtl (~${booking.bagsCount} Bags)`);
  addRow('MSP Rate:', `Rs. ${booking.mspRate} / Qtl`);

  y += 2;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, pageWidth - 6, y);
  doc.setLineDashPattern([], 0);

  y += 4;
  doc.setFontSize(6.5);
  doc.text('कृपया समय से 15 मिनट पूर्व गेट पर पहुंचे।', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('PFMS Direct Benefit Transfer via Aadhaar', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text(`CSC Kiosk: ${meta.operatorId}`, pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Toll-Free Helpline: 1800-180-DOCA', pageWidth / 2, y, { align: 'center' });
}

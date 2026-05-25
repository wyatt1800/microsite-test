import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';

export interface W9FormData {
  legalName: string;
  businessName: string;
  taxClassification: string;
  exemptPayeeCode: string;
  fatcaCode: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  tinType: 'ssn' | 'ein';
  tin: string;
}

const TAX_CLASSIFICATION_LABELS: Record<string, string> = {
  individual: 'Individual/sole proprietor or single-member LLC',
  'llc-single': 'Single-member LLC',
  'llc-multi': 'LLC (classified as partnership)',
  'llc-scorp': 'LLC (electing S corporation tax treatment)',
  'llc-ccorp': 'LLC (electing C corporation tax treatment)',
  ccorp: 'C corporation',
  scorp: 'S corporation',
  partnership: 'Partnership',
  trust: 'Trust/estate',
  other: 'Other',
};

function formatTin(tin: string, tinType: 'ssn' | 'ein'): string {
  const digits = tin.replace(/\D/g, '');
  if (tinType === 'ssn' && digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  if (tinType === 'ein' && digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return tin;
}

function drawHorizontalRule(
  page: ReturnType<PDFDocument['addPage']>,
  y: number,
  margin: number,
  width: number,
) {
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.75, 0.75, 0.75),
  });
}

function drawSectionHeader(
  page: ReturnType<PDFDocument['addPage']>,
  text: string,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
  margin: number,
  width: number,
) {
  page.drawRectangle({
    x: margin,
    y: y - 2,
    width: width - margin * 2,
    height: 18,
    color: rgb(0.94, 0.96, 0.99),
  });
  page.drawText(text, {
    x: margin + 6,
    y: y + 2,
    size: 9,
    font: boldFont,
    color: rgb(0.06, 0.11, 0.18),
  });
}

function drawField(
  page: ReturnType<PDFDocument['addPage']>,
  label: string,
  value: string,
  x: number,
  y: number,
  fieldWidth: number,
  font: PDFFont,
  boldFont: PDFFont,
) {
  page.drawText(label, {
    x,
    y: y + 14,
    size: 7,
    font,
    color: rgb(0.42, 0.45, 0.52),
  });
  page.drawRectangle({
    x,
    y,
    width: fieldWidth,
    height: 18,
    borderColor: rgb(0.82, 0.85, 0.89),
    borderWidth: 0.75,
    color: rgb(1, 1, 1),
  });
  if (value) {
    page.drawText(value, {
      x: x + 6,
      y: y + 5,
      size: 9,
      font: boldFont,
      color: rgb(0.06, 0.11, 0.18),
      maxWidth: fieldWidth - 12,
    });
  }
}

export async function generateW9PDF(data: W9FormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const margin = 48;
  const contentWidth = width - margin * 2;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - margin;

  // --- Header bar ---
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width,
    height: 60,
    color: rgb(0.06, 0.11, 0.18),
  });

  page.drawText('Form W-9', {
    x: margin,
    y: height - 26,
    size: 20,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Request for Taxpayer Identification Number and Certification', {
    x: margin,
    y: height - 42,
    size: 8,
    font,
    color: rgb(0.72, 0.78, 0.87),
  });

  page.drawText('Rev. March 2024  |  Department of the Treasury  |  Internal Revenue Service', {
    x: width - margin - 220,
    y: height - 34,
    size: 7,
    font,
    color: rgb(0.72, 0.78, 0.87),
  });

  y = height - 80;

  // --- Notice ---
  page.drawText(
    'Give form to the requester. Do not send to the IRS.',
    {
      x: margin,
      y,
      size: 7.5,
      font,
      color: rgb(0.42, 0.45, 0.52),
    },
  );

  y -= 28;

  // --- Section 1: Taxpayer Information ---
  drawSectionHeader(page, 'PART 1 — TAXPAYER INFORMATION', y, font, boldFont, margin, width);
  y -= 24;

  // Line 1: Legal name
  drawField(page, 'Line 1 — Name (as shown on your income tax return)', data.legalName, margin, y, contentWidth, font, boldFont);
  y -= 42;

  // Line 2: Business name
  drawField(page, 'Line 2 — Business name / disregarded entity name (optional)', data.businessName || '—', margin, y, contentWidth, font, boldFont);
  y -= 42;

  drawHorizontalRule(page, y + 10, margin, width);
  y -= 8;

  // Line 3: Tax classification
  drawField(
    page,
    'Line 3a — Federal tax classification',
    TAX_CLASSIFICATION_LABELS[data.taxClassification] ?? data.taxClassification,
    margin,
    y,
    contentWidth,
    font,
    boldFont,
  );
  y -= 42;

  // Line 4: Exemptions (two columns)
  const halfWidth = (contentWidth - 12) / 2;
  drawField(page, 'Line 4 — Exempt payee code (if any)', data.exemptPayeeCode || '—', margin, y, halfWidth, font, boldFont);
  drawField(page, 'Exemption from FATCA reporting code (if any)', data.fatcaCode || '—', margin + halfWidth + 12, y, halfWidth, font, boldFont);
  y -= 42;

  drawHorizontalRule(page, y + 10, margin, width);
  y -= 8;

  // Lines 5-6: Address
  drawSectionHeader(page, 'ADDRESS', y, font, boldFont, margin, width);
  y -= 24;

  drawField(page, 'Line 5 — Street address (number, street, and apt. or suite no.)', data.streetAddress, margin, y, contentWidth, font, boldFont);
  y -= 42;

  const cityWidth = contentWidth * 0.45;
  const stateWidth = contentWidth * 0.15;
  const zipWidth = contentWidth - cityWidth - stateWidth - 24;

  drawField(page, 'City', data.city, margin, y, cityWidth, font, boldFont);
  drawField(page, 'State', data.state, margin + cityWidth + 12, y, stateWidth, font, boldFont);
  drawField(page, 'ZIP code', data.zip, margin + cityWidth + stateWidth + 24, y, zipWidth, font, boldFont);
  y -= 48;

  // --- Section 2: TIN ---
  drawSectionHeader(page, 'PART I — TAXPAYER IDENTIFICATION NUMBER (TIN)', y, font, boldFont, margin, width);
  y -= 24;

  const tinLabel = data.tinType === 'ssn' ? 'Social Security Number (SSN)' : 'Employer Identification Number (EIN)';
  const formattedTin = formatTin(data.tin, data.tinType);

  drawField(page, tinLabel, formattedTin, margin, y, contentWidth, font, boldFont);
  y -= 42;

  // --- Section 3: Certification ---
  drawSectionHeader(page, 'PART II — CERTIFICATION', y, font, boldFont, margin, width);
  y -= 20;

  const certText = [
    'Under penalties of perjury, I certify that:',
    '1. The number shown on this form is my correct taxpayer identification number.',
    '2. I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the IRS',
    '   that I am subject to backup withholding, or (c) the IRS has notified me that I am no longer subject to backup withholding.',
    '3. I am a U.S. citizen or other U.S. person.',
    '4. The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.',
  ];

  for (const line of certText) {
    page.drawText(line, {
      x: margin,
      y,
      size: 7.5,
      font,
      color: rgb(0.25, 0.28, 0.35),
    });
    y -= 12;
  }

  y -= 10;

  // Signature line
  const sigDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sigWidth = contentWidth * 0.65;
  const dateWidth = contentWidth - sigWidth - 12;

  page.drawRectangle({
    x: margin,
    y,
    width: sigWidth,
    height: 28,
    borderColor: rgb(0.82, 0.85, 0.89),
    borderWidth: 0.75,
    color: rgb(1, 1, 1),
  });
  page.drawText('Signature of U.S. person', { x: margin + 6, y: y + 18, size: 7, font, color: rgb(0.42, 0.45, 0.52) });
  page.drawText(data.legalName, { x: margin + 6, y: y + 6, size: 9, font: boldFont, color: rgb(0.06, 0.11, 0.18) });

  page.drawRectangle({
    x: margin + sigWidth + 12,
    y,
    width: dateWidth,
    height: 28,
    borderColor: rgb(0.82, 0.85, 0.89),
    borderWidth: 0.75,
    color: rgb(1, 1, 1),
  });
  page.drawText('Date', { x: margin + sigWidth + 18, y: y + 18, size: 7, font, color: rgb(0.42, 0.45, 0.52) });
  page.drawText(sigDate, { x: margin + sigWidth + 18, y: y + 6, size: 9, font: boldFont, color: rgb(0.06, 0.11, 0.18) });

  y -= 40;

  // --- Footer notice ---
  drawHorizontalRule(page, y, margin, width);
  y -= 14;

  const disclaimer =
    'This document was generated by W9 Helper (w9helper.com), a free independent tool. It is not affiliated with the IRS. ' +
    'Review all information for accuracy before submitting to the requesting party.';

  page.drawText(disclaimer, {
    x: margin,
    y,
    size: 6.5,
    font,
    color: rgb(0.62, 0.65, 0.72),
    maxWidth: contentWidth,
  });

  return pdfDoc.save();
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

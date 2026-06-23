import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { PDFForm } from 'pdf-lib';

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

// ─── W-9 Rev. March 2024 field map ──────────────────────────────────────────
// Field names were enumerated from the live IRS PDF using
// scripts/inspect-w9-fields.mjs. To update for a new IRS revision:
//   1. Replace public/fw9.pdf with the new file from https://www.irs.gov/pub/irs-pdf/fw9.pdf
//   2. Re-run:  node scripts/inspect-w9-fields.mjs
//   3. Update the FIELD object below to match the new field names.
const FIELD = {
  name:           'topmostSubform[0].Page1[0].f1_01[0]',
  businessName:   'topmostSubform[0].Page1[0].f1_02[0]',
  // Line 3a — tax classification checkboxes (exactly one checked)
  chkIndividual:  'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[0]',
  chkCCorp:       'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[1]',
  chkSCorp:       'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[2]',
  chkPartnership: 'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[3]',
  chkTrust:       'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[4]',
  chkLlc:         'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[5]',
  chkOther:       'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[6]',
  // Line 3b — LLC classification letter (maxLength=1: C, S, or P)
  llcType:        'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_03[0]',
  // Line 4
  exemptPayee:    'topmostSubform[0].Page1[0].f1_05[0]',
  fatcaCode:      'topmostSubform[0].Page1[0].f1_06[0]',
  // Lines 5–6
  streetAddress:  'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_07[0]',
  cityStateZip:   'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_08[0]',
  // f1_09 = Requester's name/address (filled by requester, not the taxpayer)
  // f1_10 = Account number(s) optional — not used
  // Part I — SSN (three boxes, maxLength 3/2/4)
  ssn1:           'topmostSubform[0].Page1[0].f1_11[0]',
  ssn2:           'topmostSubform[0].Page1[0].f1_12[0]',
  ssn3:           'topmostSubform[0].Page1[0].f1_13[0]',
  // Part I — EIN (two boxes, maxLength 2/7)
  ein1:           'topmostSubform[0].Page1[0].f1_14[0]',
  ein2:           'topmostSubform[0].Page1[0].f1_15[0]',
} as const;

// 'llc-single' maps to the Individual checkbox because a single-member LLC
// disregarded from its owner uses the owner's classification per W-9 instructions.
const CLASSIFICATION_TO_CHECKBOX: Record<string, string> = {
  individual:   FIELD.chkIndividual,
  'llc-single': FIELD.chkIndividual,
  ccorp:        FIELD.chkCCorp,
  scorp:        FIELD.chkSCorp,
  partnership:  FIELD.chkPartnership,
  trust:        FIELD.chkTrust,
  'llc-multi':  FIELD.chkLlc,
  'llc-scorp':  FIELD.chkLlc,
  'llc-ccorp':  FIELD.chkLlc,
  other:        FIELD.chkOther,
};

const LLC_TYPE_LETTER: Record<string, string> = {
  'llc-multi': 'P',
  'llc-scorp': 'S',
  'llc-ccorp': 'C',
};

// Part II Certification has no AcroForm fields in this PDF revision.
// We overlay the typed name and date directly on the page at Y=200,
// confirmed by visual inspection with scripts/probe-sig-y.mjs.
// To switch to a print-and-sign flow: remove the overlaySignature call below
// and update the certification copy in W9Form's Step 6.
const SIG_COORDS  = { x: 175, y: 197, size: 10 } as const;
const DATE_COORDS = { x: 420, y: 197, size: 10 } as const;

async function loadPdfTemplate(): Promise<ArrayBuffer> {
  const res = await fetch('/fw9.pdf');
  if (!res.ok) throw new Error(`Failed to load W-9 template (HTTP ${res.status})`);
  return res.arrayBuffer();
}

function applyTaxClassification(form: PDFForm, classification: string): void {
  const checkboxName = CLASSIFICATION_TO_CHECKBOX[classification];
  if (checkboxName) form.getCheckBox(checkboxName).check();

  const llcLetter = LLC_TYPE_LETTER[classification];
  if (llcLetter) form.getTextField(FIELD.llcType).setText(llcLetter);
}

function applyTin(form: PDFForm, tinType: 'ssn' | 'ein', tin: string): void {
  const digits = tin.replace(/\D/g, '');
  if (tinType === 'ssn') {
    form.getTextField(FIELD.ssn1).setText(digits.slice(0, 3));
    form.getTextField(FIELD.ssn2).setText(digits.slice(3, 5));
    form.getTextField(FIELD.ssn3).setText(digits.slice(5, 9));
  } else {
    form.getTextField(FIELD.ein1).setText(digits.slice(0, 2));
    form.getTextField(FIELD.ein2).setText(digits.slice(2, 9));
  }
}

function todayAsMMDDYYYY(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

async function overlaySignature(pdfDoc: PDFDocument, legalName: string): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPages()[0];
  page.drawText(legalName, { x: SIG_COORDS.x, y: SIG_COORDS.y, size: SIG_COORDS.size, font });
  page.drawText(todayAsMMDDYYYY(), { x: DATE_COORDS.x, y: DATE_COORDS.y, size: DATE_COORDS.size, font });
}

export async function fillW9PDF(data: W9FormData): Promise<Uint8Array> {
  const templateBytes = await loadPdfTemplate();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  form.getTextField(FIELD.name).setText(data.legalName);
  form.getTextField(FIELD.businessName).setText(data.businessName);
  applyTaxClassification(form, data.taxClassification);
  form.getTextField(FIELD.exemptPayee).setText(data.exemptPayeeCode);
  form.getTextField(FIELD.fatcaCode).setText(data.fatcaCode);
  form.getTextField(FIELD.streetAddress).setText(data.streetAddress);
  form.getTextField(FIELD.cityStateZip).setText(`${data.city}, ${data.state} ${data.zip}`);
  applyTin(form, data.tinType, data.tin);
  await overlaySignature(pdfDoc, data.legalName);

  form.flatten();
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

/**
 * One-time field enumeration tool for the IRS W-9 fillable PDF.
 *
 * Run this whenever public/fw9.pdf is replaced with a new IRS revision:
 *   node scripts/inspect-w9-fields.mjs
 *
 * The output shows every AcroForm field name, type, maxLength, and page
 * position (Y descending = top-to-bottom). Use it to update the FIELD map
 * in src/lib/fillW9PDF.ts.
 */
import { readFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = resolve(__dirname, '../public/fw9.pdf');

const pdfDoc = await PDFDocument.load(readFileSync(pdfPath));
const form = pdfDoc.getForm();

const rows = [];
for (const field of form.getFields()) {
  const type = field.constructor.name;
  const name = field.getName();
  const maxLen = type === 'PDFTextField' ? field.getMaxLength() : undefined;
  for (const widget of field.acroField.getWidgets()) {
    const r = widget.getRectangle();
    rows.push({ name, type, maxLen, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
  }
}

rows.sort((a, b) => b.y - a.y || a.x - b.x);

console.log(`Total fields: ${form.getFields().length}\n`);
console.log('Y    X    W    H  maxL  Type               Name');
console.log('─'.repeat(90));
for (const r of rows) {
  const ml = r.maxLen != null ? String(r.maxLen) : '';
  console.log(
    `${String(r.y).padStart(4)} ${String(r.x).padStart(4)} ${String(r.w).padStart(4)} ${String(r.h).padStart(4)}` +
    `  ${ml.padStart(4)}  ${r.type.padEnd(18)} ${r.name}`
  );
}

// ---------------------------------------------------------------------------
// Generates test/email_personalization_test_dataset.pdf — a text-layer PDF
// with five recipient profiles, each with a different personalization context.
// Written by hand (no PDF library) so the fixture is dependency-free and
// reproducible: run `node test/make-test-pdf.mjs`.
// ---------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LINES = [
  'College Outreach Contact List',
  '----------------------------------------------',
  '',
  'Dr. Sarah Chen, AI ethics researcher, Stanford University, published on algorithmic fairness in healthcare AI',
  'sarah.chen@example.edu',
  '',
  'Prof. Marcus Webb, Robotics professor, Georgia Institute of Technology, leads an autonomous systems lab',
  'marcus.webb@example.edu',
  '',
  'Dr. Priya Sharma, Renewable energy scientist, IIT Delhi, works on perovskite solar cells',
  'priya.sharma@example.edu',
  '',
  'Dr. Elena Petrova, Neuroscience researcher, University of Toronto, studies brain-computer interfaces',
  'elena.petrova@example.edu',
  '',
  'Dr. James Okafor, Public health specialist, University of Lagos, models infectious disease spread',
  'james.okafor@example.edu',
];

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines) {
  const fontSize = 11;
  const leading = 16;
  const startY = 720;
  const ops = [];
  ops.push('BT');
  ops.push('/F1 16 Tf');
  ops.push(`1 0 0 1 72 ${startY} Tm`);
  lines.forEach((line, i) => {
    if (i > 0) ops.push(`0 -${leading} Td`);
    ops.push(`(${esc(line)}) Tj`);
  });
  ops.push('ET');

  // The stream bytes between "stream\n" and "endstream" include the trailing
  // newline — count it so /Length matches exactly (strict parsers reject mismatches).
  const stream = `${ops.join('\n')}\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf-8')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  // xref entries must be exactly 20 bytes each; CRLF is the spec-canonical
  // form (pdf-parse's bundled 2019-era pdf.js rejects shorter/nonstandard rows).
  const xrefStart = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \r\n';
  offsets.forEach(off => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \r\n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return pdf;
}

const outPath = path.join(__dirname, 'email_personalization_test_dataset.pdf');
fs.writeFileSync(outPath, buildPdf(LINES), 'utf-8');
console.log(`Wrote ${outPath} (${fs.statSync(outPath).size} bytes)`);

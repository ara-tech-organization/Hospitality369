/**
 * Branded PDF report of candidate applications (A4 landscape table).
 * Streams directly to the HTTP response.
 */
const PDFDocument = require('pdfkit');

const NAVY = '#0b1030';
const NAVY_SOFT = '#515d8e';
const ORANGE = '#f7901e';
const LINE = '#e4e9fa';
const ZEBRA = '#f7f8fc';

const COLUMNS = [
  { key: 'n', label: '#', width: 26 },
  { key: 'fullName', label: 'Name', width: 120 },
  { key: 'email', label: 'Email', width: 160 },
  { key: 'mobile', label: 'Mobile', width: 92 },
  { key: 'roleTitle', label: 'Applied role', width: 112 },
  { key: 'position', label: 'Position', width: 112 },
  { key: 'createdAt', label: 'Applied on', width: 72 },
  { key: 'status', label: 'Status', width: 68 },
];

const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * @param {import('express').Response} res
 * @param {AsyncIterable<object>} rows  application docs (lean)
 * @param {{ title: string, subtitle: string }} meta
 * @returns {Promise<number>} rows written
 */
async function streamCandidatesPdf(res, rows, meta) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true, info: { Title: meta.title, Author: 'Hospitality369' } });
  doc.pipe(res);

  const left = doc.page.margins.left;
  const tableWidth = COLUMNS.reduce((a, c) => a + c.width, 0);
  const bottom = () => doc.page.height - doc.page.margins.bottom - 24;

  // ---- report header (first page) ----
  doc.rect(0, 0, doc.page.width, 78).fill(NAVY);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('Hospitality', left, 24, { continued: true }).fillColor(ORANGE).text('369');
  doc.fillColor('#c9d2f3').font('Helvetica').fontSize(10).text(meta.title, left, 50);
  doc.fillColor('#c9d2f3').fontSize(9).text(`Generated ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`, left, 30, { width: tableWidth, align: 'right' });
  doc.fillColor(ORANGE).fontSize(9).text(meta.subtitle, left, 50, { width: tableWidth, align: 'right' });
  let y = 100;

  const drawHeader = () => {
    doc.rect(left, y, tableWidth, 22).fill(NAVY);
    let x = left;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
    COLUMNS.forEach((c) => {
      doc.text(c.label.toUpperCase(), x + 6, y + 7, { width: c.width - 10, lineBreak: false });
      x += c.width;
    });
    y += 22;
  };
  drawHeader();

  let count = 0;
  for await (const r of rows) {
    count += 1;
    const values = {
      n: String(count),
      fullName: r.fullName,
      email: r.email,
      mobile: r.mobile,
      roleTitle: r.roleTitle,
      position: r.position || '—',
      createdAt: fmtDate(r.createdAt),
      status: cap(r.status),
    };
    // row height = tallest wrapped cell
    doc.font('Helvetica').fontSize(8.5);
    const h = Math.max(20, ...COLUMNS.map((c) => doc.heightOfString(values[c.key], { width: c.width - 12 }) + 10));
    if (y + h > bottom()) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }
    if (count % 2 === 0) doc.rect(left, y, tableWidth, h).fill(ZEBRA);
    let x = left;
    COLUMNS.forEach((c) => {
      const isName = c.key === 'fullName';
      const isStatus = c.key === 'status';
      doc.font(isName ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor(isStatus ? ORANGE : isName ? NAVY : NAVY_SOFT);
      doc.text(values[c.key], x + 6, y + 5, { width: c.width - 12 });
      x += c.width;
    });
    doc.moveTo(left, y + h).lineTo(left + tableWidth, y + h).lineWidth(0.5).strokeColor(LINE).stroke();
    y += h;
  }

  if (!count) {
    doc.font('Helvetica').fontSize(11).fillColor(NAVY_SOFT).text('No candidates match these filters.', left, y + 20);
  }

  // ---- footer with page numbers ----
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const fy = doc.page.height - doc.page.margins.bottom - 10;
    doc.font('Helvetica').fontSize(8).fillColor(NAVY_SOFT);
    doc.text(`Hospitality369 · Confidential candidate data · ${count} record${count === 1 ? '' : 's'}`, left, fy, { lineBreak: false });
    doc.text(`Page ${i + 1} of ${range.count}`, left, fy, { width: tableWidth, align: 'right', lineBreak: false });
  }

  doc.end();
  await new Promise((resolve) => res.on('finish', resolve));
  return count;
}

module.exports = { streamCandidatesPdf };

const PDFDocument = require("pdfkit");

const _drawTable = (doc, rows, startY) => {
  if (!rows || !rows.length) {
    doc.fontSize(10).font("Helvetica").text("No data available.", doc.page.margins.left, startY);
    return startY + 20;
  }

  const headers = Object.keys(rows[0]);
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / headers.length;
  const rowHeight = 18;
  doc.fontSize(8);

  const drawRow = (values, y, isHeader) => {
    doc.font(isHeader ? "Helvetica-Bold" : "Helvetica");
    values.forEach((v, i) => {
      doc.text(v === null || v === undefined ? "" : String(v), doc.page.margins.left + i * colWidth, y, {
        width: colWidth,
        ellipsis: true,
      });
    });
  };

  let y = startY;
  drawRow(headers, y, true);
  y += rowHeight;

  rows.forEach((row) => {
    if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
      doc.addPage();
      y = doc.page.margins.top;
      drawRow(headers, y, true);
      y += rowHeight;
    }
    drawRow(headers.map((h) => row[h]), y, false);
    y += rowHeight;
  });

  return y;
};

const toPDFBuffer = (rows, title = "Report") =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "center" });
    doc.moveDown();
    _drawTable(doc, rows, doc.y);
    doc.end();
  });

const toPDFSectionsBuffer = (sections, title = "Report") =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "center" });
    doc.moveDown();

    sections.forEach((section, i) => {
      if (i > 0) doc.moveDown();
      if (doc.y > doc.page.height - doc.page.margins.bottom - 60) doc.addPage();
      doc.fontSize(12).font("Helvetica-Bold").text(section.title);
      doc.moveDown(0.5);
      const endY = _drawTable(doc, section.rows, doc.y);
      doc.y = endY;
    });

    doc.end();
  });

module.exports = { toPDFBuffer, toPDFSectionsBuffer };

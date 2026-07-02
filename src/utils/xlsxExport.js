const ExcelJS = require("exceljs");

const toXLSXBuffer = async (rows, sheetName = "Report") => {
  const workbook = new ExcelJS.Workbook();
  const safeName = String(sheetName).replace(/[*?:/\\[\]]/g, "").slice(0, 31) || "Report";
  const sheet = workbook.addWorksheet(safeName);

  if (rows && rows.length) {
    const headers = Object.keys(rows[0]);
    sheet.columns = headers.map((h) => ({ header: h, key: h, width: 20 }));
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));
  }

  return workbook.xlsx.writeBuffer();
};

const toXLSXSectionsBuffer = async (sections, workbookTitle = "Report") => {
  const workbook = new ExcelJS.Workbook();
  const usedNames = new Set();

  sections.forEach((section) => {
    let name = String(section.title).replace(/[*?:/\\[\]]/g, "").slice(0, 31) || "Sheet";
    let suffix = 1;
    while (usedNames.has(name)) {
      const base = name.slice(0, 27);
      name = `${base}(${++suffix})`;
    }
    usedNames.add(name);

    const sheet = workbook.addWorksheet(name);
    const rows = section.rows || [];
    if (rows.length) {
      const headers = Object.keys(rows[0]);
      sheet.columns = headers.map((h) => ({ header: h, key: h, width: 20 }));
      sheet.getRow(1).font = { bold: true };
      rows.forEach((row) => sheet.addRow(row));
    } else {
      sheet.addRow(["No data available"]);
    }
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = { toXLSXBuffer, toXLSXSectionsBuffer };

const { printer: ThermalPrinter, types: PrinterTypes } = require("node-thermal-printer");

const CHAR_WIDTH = { "58mm": 32, "80mm": 42 };

// Thermal printers use fixed ESC/POS code pages that don't cover most Unicode
// (₹, emoji, accented letters). Encoding an unsupported char throws, so any
// text reaching the printer must be reduced to ASCII first.
const toAscii = (text) =>
  String(text ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[^\x00-\x7F]/g, "");

const createPrinterInstance = ({ ip, port }) =>
  new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `tcp://${ip}:${port || 9100}`,
    removeSpecialCharacters: false,
    width: 42,
    options: { timeout: 5000 },
  });

const applyAlign = (instance, align) => {
  if (align === "center") instance.alignCenter();
  else if (align === "right") instance.alignRight();
  else instance.alignLeft();
};

const applySize = (instance, size) => {
  if (size === "large") instance.setTextDoubleHeight();
  else if (size === "small") instance.setTextNormal();
  else instance.setTextNormal();
};

const renderBlocksToInstance = (instance, doc) => {
  const width = CHAR_WIDTH[doc.paperWidth] || 42;

  for (const block of doc.blocks) {
    switch (block.type) {
      case "text": {
        applyAlign(instance, block.align);
        applySize(instance, block.size);
        instance.bold(!!block.bold);
        instance.println(toAscii(block.text));
        instance.bold(false);
        instance.setTextNormal();
        instance.alignLeft();
        break;
      }
      case "row": {
        const left = toAscii(block.left);
        const right = toAscii(block.right);
        const padding = Math.max(width - left.length - right.length, 1);
        instance.bold(!!block.bold);
        instance.println(`${left}${" ".repeat(padding)}${right}`);
        instance.bold(false);
        break;
      }
      case "line": {
        instance.drawLine();
        break;
      }
      case "table": {
        const columns = block.columns.map((col) => ({
          text: toAscii(col.label),
          align: col.align.toUpperCase(),
          width: col.width,
          bold: true,
        }));
        instance.tableCustom(columns);
        for (const row of block.rows) {
          const cells = block.columns.map((col) => ({
            text: toAscii(row[col.key]),
            align: col.align.toUpperCase(),
            width: col.width,
          }));
          instance.tableCustom(cells);
        }
        break;
      }
      case "spacer": {
        for (let i = 0; i < (block.lines || 1); i += 1) instance.newLine();
        break;
      }
      case "cut": {
        instance.cut();
        break;
      }
      default:
        break;
    }
  }
};

const buildBuffer = (doc) => {
  const instance = createPrinterInstance({ ip: "0.0.0.0", port: 9100 });
  renderBlocksToInstance(instance, doc);
  return instance.getBuffer();
};

const printToNetwork = async ({ ip, port }, doc) => {
  const instance = createPrinterInstance({ ip, port });
  renderBlocksToInstance(instance, doc);
  await instance.execute();
};

module.exports = { buildBuffer, printToNetwork };

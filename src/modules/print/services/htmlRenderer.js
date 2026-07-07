const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const renderBlockHtml = (block) => {
  switch (block.type) {
    case "text": {
      const styles = [`text-align:${block.align || "left"}`];
      if (block.bold) styles.push("font-weight:bold");
      if (block.size === "large") styles.push("font-size:1.3em");
      if (block.size === "small") styles.push("font-size:0.85em");
      return `<div style="${styles.join(";")}">${escapeHtml(block.text)}</div>`;
    }
    case "row": {
      const weight = block.bold ? "font-weight:bold;" : "";
      return `<div style="display:flex;justify-content:space-between;${weight}"><span>${escapeHtml(block.left)}</span><span>${escapeHtml(block.right)}</span></div>`;
    }
    case "line":
      return `<hr style="border:none;border-top:1px dashed #000;margin:4px 0" />`;
    case "table": {
      const head = block.columns
        .map((col) => `<th style="text-align:${col.align};padding:2px 4px;border-bottom:1px solid #000">${escapeHtml(col.label)}</th>`)
        .join("");
      const rows = block.rows
        .map(
          (row) =>
            `<tr>${block.columns
              .map((col) => `<td style="text-align:${col.align};padding:2px 4px">${escapeHtml(row[col.key])}</td>`)
              .join("")}</tr>`,
        )
        .join("");
      return `<table style="width:100%;border-collapse:collapse;font-size:0.9em"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    case "spacer":
      return `<div style="height:${(block.lines || 1) * 12}px"></div>`;
    case "cut":
      return "";
    default:
      return "";
  }
};

const renderHtml = (doc, { autoPrint = false } = {}) => {
  const width = doc.paperWidth || "80mm";
  const body = doc.blocks.map(renderBlockHtml).join("\n");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(doc.title || "Print")}</title>
<style>
  @page { size: ${width} auto; margin: 0; }
  body { width: ${width}; margin: 0 auto; padding: 8px; font-family: "Courier New", monospace; color: #000; }
  table, div { box-sizing: border-box; }
</style>
</head>
<body${autoPrint ? ' onload="window.print()"' : ""}>
${body}
</body>
</html>`;
};

module.exports = { renderHtml };

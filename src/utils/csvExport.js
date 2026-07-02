const esc = (v) => {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCSV = (rows) => {
  if (!rows || !rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
};

const toSectionsCSV = (sections) =>
  sections
    .map((section) => `## ${section.title}\n${toCSV(section.rows) || "(no data)"}`)
    .join("\n\n");

module.exports = { toCSV, toSectionsCSV };

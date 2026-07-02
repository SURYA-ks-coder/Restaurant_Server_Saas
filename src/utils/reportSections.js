const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);

const humanize = (key) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

const SKIP_KEYS = new Set(["meta"]);

/**
 * Flattens an aggregate report object (mix of scalars, nested summary
 * objects, and record arrays) into named table sections for PDF/XLSX export.
 */
const toSections = (data) => {
  if (Array.isArray(data)) return [{ title: "Report", rows: data }];
  if (!isPlainObject(data)) return [{ title: "Report", rows: [{ value: data }] }];

  const summaryRow = {};
  const sections = [];

  for (const [key, value] of Object.entries(data)) {
    if (SKIP_KEYS.has(key)) continue;

    if (Array.isArray(value)) {
      const rows = value.length && !isPlainObject(value[0])
        ? value.map((v) => ({ value: v }))
        : value;
      sections.push({ title: humanize(key), rows });
    } else if (isPlainObject(value)) {
      for (const [subKey, subVal] of Object.entries(value)) {
        if (Array.isArray(subVal) && subVal.length) {
          sections.push({ title: `${humanize(key)} - ${humanize(subKey)}`, rows: subVal });
        } else if (!Array.isArray(subVal) && !isPlainObject(subVal)) {
          summaryRow[`${key}.${subKey}`] = subVal;
        }
      }
    } else {
      summaryRow[key] = value;
    }
  }

  if (Object.keys(summaryRow).length) sections.unshift({ title: "Summary", rows: [summaryRow] });

  return sections.length ? sections : [{ title: "Report", rows: [] }];
};

module.exports = { toSections };

export type CsvRow = { jp: string; en: string };
export type CsvParseResult = { rows: CsvRow[]; errors: string[] };

/**
 * Parses a simple two-column CSV (jp,en — one entry per line).
 * Returns valid rows and any per-line error messages.
 */
export function parseVocabCSV(text: string): CsvParseResult {
  const rows: CsvRow[] = [];
  const errors: string[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    errors.push("File is empty.");
    return { rows, errors };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Support comma or tab as separator
    const separatorMatch = line.match(/^([^,\t]+)[,\t](.+)$/);

    if (!separatorMatch) {
      errors.push(`Line ${i + 1}: could not parse "${line}" — expected "jp,en".`);
      continue;
    }

    const jp = separatorMatch[1].trim();
    const en = separatorMatch[2].trim();

    if (!jp || !en) {
      errors.push(`Line ${i + 1}: both columns must be non-empty.`);
      continue;
    }

    rows.push({ jp, en });
  }

  return { rows, errors };
}

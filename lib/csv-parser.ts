import { containsJapanese, VOCAB_LIMITS } from "./vocab-validation";

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

    if (!containsJapanese(jp)) {
      errors.push(`Line ${i + 1}: "${jp}" does not appear to be Japanese — first column must contain hiragana, katakana, or kanji.`);
      continue;
    }

    if (jp.length > VOCAB_LIMITS.jpMax) {
      errors.push(`Line ${i + 1}: Japanese word exceeds ${VOCAB_LIMITS.jpMax} characters.`);
      continue;
    }

    if (en.length > VOCAB_LIMITS.enMax) {
      errors.push(`Line ${i + 1}: English meaning exceeds ${VOCAB_LIMITS.enMax} characters.`);
      continue;
    }

    rows.push({ jp, en });
  }

  return { rows, errors };
}

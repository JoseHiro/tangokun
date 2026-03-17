/** Matches at least one hiragana, katakana, kanji, or half-width katakana character. */
const JAPANESE_RE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF65-\uFF9F]/;

export const VOCAB_LIMITS = {
  jpMax: 50,
  enMax: 100,
} as const;

export function containsJapanese(str: string): boolean {
  return JAPANESE_RE.test(str);
}

export type VocabFieldErrors = {
  jp?: string;
  en?: string;
};

/**
 * Validates jp/en values and returns an error object.
 * Keys are only present when there is an error.
 * Pass translated error strings to keep this function framework-agnostic.
 */
export function validateVocabFields(
  jp: string,
  en: string,
  errors: {
    jpRequired: string;
    jpNotJapanese: string;
    jpTooLong: string;
    enRequired: string;
    enTooLong: string;
  },
): VocabFieldErrors {
  const result: VocabFieldErrors = {};

  if (!jp.trim()) {
    result.jp = errors.jpRequired;
  } else if (!containsJapanese(jp)) {
    result.jp = errors.jpNotJapanese;
  } else if (jp.length > VOCAB_LIMITS.jpMax) {
    result.jp = errors.jpTooLong;
  }

  if (!en.trim()) {
    result.en = errors.enRequired;
  } else if (en.length > VOCAB_LIMITS.enMax) {
    result.en = errors.enTooLong;
  }

  return result;
}

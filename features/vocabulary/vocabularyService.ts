import { prisma } from "@/lib/prisma";
import type { VocabWord } from "@/types/practice";

/**
 * Fetches vocabulary words for a user.
 * If vocabIds is non-empty, returns only the specified words.
 * If empty, returns all words belonging to the user.
 */
export async function getUserVocabulary(
  userId: string,
  vocabIds: string[] = []
): Promise<VocabWord[]> {
  return prisma.vocabulary.findMany({
    where: {
      userId,
      ...(vocabIds.length > 0 ? { id: { in: vocabIds } } : {}),
    },
    select: { id: true, jp: true, en: true },
  });
}

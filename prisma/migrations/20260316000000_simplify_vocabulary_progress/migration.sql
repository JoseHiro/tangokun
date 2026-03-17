-- Drop old SRS columns (data will be lost — intentional schema change)
ALTER TABLE "VocabularyProgress" DROP COLUMN "correctCount";
ALTER TABLE "VocabularyProgress" DROP COLUMN "wrongCount";
ALTER TABLE "VocabularyProgress" DROP COLUMN "ease";
ALTER TABLE "VocabularyProgress" DROP COLUMN "interval";
ALTER TABLE "VocabularyProgress" DROP COLUMN "dueDate";

-- Add new session-level progress columns
ALTER TABLE "VocabularyProgress" ADD COLUMN "lifetimeAttempts"    INTEGER          NOT NULL DEFAULT 0;
ALTER TABLE "VocabularyProgress" ADD COLUMN "lifetimeCorrect"     INTEGER          NOT NULL DEFAULT 0;
ALTER TABLE "VocabularyProgress" ADD COLUMN "recentSessionScores" JSONB            NOT NULL DEFAULT '[]';
ALTER TABLE "VocabularyProgress" ADD COLUMN "lastSessionScore"    DOUBLE PRECISION;
ALTER TABLE "VocabularyProgress" ADD COLUMN "lastSeen"            TIMESTAMP(3);

-- Add indexes on userId for fast per-user queries as vocabulary grows large
CREATE INDEX IF NOT EXISTS "Vocabulary_userId_idx" ON "Vocabulary"("userId");
CREATE INDEX IF NOT EXISTS "MistakeLog_userId_idx" ON "MistakeLog"("userId");
CREATE INDEX IF NOT EXISTS "PracticeLog_userId_idx" ON "PracticeLog"("userId");

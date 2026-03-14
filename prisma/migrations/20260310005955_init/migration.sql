-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "jp" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

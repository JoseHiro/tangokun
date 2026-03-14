-- CreateTable
CREATE TABLE "Grammar" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "example" TEXT,
    "translation" TEXT,
    "jlptLevel" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grammar_pkey" PRIMARY KEY ("id")
);

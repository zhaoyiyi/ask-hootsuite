-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "Documents" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "embedding" vector(1536),

    CONSTRAINT "Documents_pkey" PRIMARY KEY ("id")
);

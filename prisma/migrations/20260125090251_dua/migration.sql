/*
  Warnings:

  - You are about to drop the column `france` on the `Dua` table. All the data in the column will be lost.
  - You are about to drop the column `spanish` on the `Dua` table. All the data in the column will be lost.
  - The `arabic` column on the `Dua` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Dua" DROP COLUMN "france",
DROP COLUMN "spanish",
ADD COLUMN     "dua" TEXT,
ADD COLUMN     "french" JSONB,
DROP COLUMN "arabic",
ADD COLUMN     "arabic" JSONB;

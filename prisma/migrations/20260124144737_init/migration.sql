/*
  Warnings:

  - You are about to drop the `Language` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Language" DROP CONSTRAINT "Language_duaId_fkey";

-- AlterTable
ALTER TABLE "Dua" ADD COLUMN     "english" JSONB,
ADD COLUMN     "france" JSONB,
ADD COLUMN     "spanish" JSONB;

-- DropTable
DROP TABLE "Language";

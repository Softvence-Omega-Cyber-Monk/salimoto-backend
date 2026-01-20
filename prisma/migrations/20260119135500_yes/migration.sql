/*
  Warnings:

  - The `name` column on the `Language` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Language" DROP COLUMN "name",
ADD COLUMN     "name" "languages" NOT NULL DEFAULT 'ENGLISH';

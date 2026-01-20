/*
  Warnings:

  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Dua` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Language` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_DuaCategories` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Language" DROP CONSTRAINT "Language_duaId_fkey";

-- DropForeignKey
ALTER TABLE "_DuaCategories" DROP CONSTRAINT "_DuaCategories_A_fkey";

-- DropForeignKey
ALTER TABLE "_DuaCategories" DROP CONSTRAINT "_DuaCategories_B_fkey";

-- AlterTable
ALTER TABLE "Category" DROP CONSTRAINT "Category_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Category_id_seq";

-- AlterTable
ALTER TABLE "Dua" DROP CONSTRAINT "Dua_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Dua_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Dua_id_seq";

-- AlterTable
ALTER TABLE "Language" DROP CONSTRAINT "Language_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "duaId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Language_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Language_id_seq";

-- AlterTable
ALTER TABLE "_DuaCategories" DROP CONSTRAINT "_DuaCategories_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ALTER COLUMN "B" SET DATA TYPE TEXT,
ADD CONSTRAINT "_DuaCategories_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_duaId_fkey" FOREIGN KEY ("duaId") REFERENCES "Dua"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DuaCategories" ADD CONSTRAINT "_DuaCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DuaCategories" ADD CONSTRAINT "_DuaCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Dua"("id") ON DELETE CASCADE ON UPDATE CASCADE;

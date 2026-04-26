/*
  Warnings:

  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `industry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `storeName` on the `User` table. All the data in the column will be lost.
  - Added the required column `storeId` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "storeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "country",
DROP COLUMN "district",
DROP COLUMN "industry",
DROP COLUMN "location",
DROP COLUMN "storeName",
ADD COLUMN     "storeId" TEXT;

-- CreateTable
CREATE TABLE "public"."Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[itemNumber]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemNumber` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "itemNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Item_itemNumber_key" ON "public"."Item"("itemNumber");

/*
  Warnings:

  - A unique constraint covering the columns `[barCodeNumber]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "barCodeNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Item_barCodeNumber_key" ON "public"."Item"("barCodeNumber");

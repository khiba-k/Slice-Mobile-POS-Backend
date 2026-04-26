-- DropForeignKey
ALTER TABLE "public"."SaleItem" DROP CONSTRAINT "SaleItem_saleId_fkey";

-- AddForeignKey
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

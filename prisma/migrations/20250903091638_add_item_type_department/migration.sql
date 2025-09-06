-- CreateTable
CREATE TABLE "public"."ItemTypeDepartment" (
    "id" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemTypeDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemTypeDepartment_itemType_departmentName_storeId_key" ON "public"."ItemTypeDepartment"("itemType", "departmentName", "storeId");

-- AddForeignKey
ALTER TABLE "public"."ItemTypeDepartment" ADD CONSTRAINT "ItemTypeDepartment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

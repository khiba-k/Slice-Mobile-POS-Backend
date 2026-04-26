-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitSize" TEXT,
    "unitType" TEXT,
    "qtyAvailable" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlertQty" INTEGER,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "costPrice" DOUBLE PRECISION,
    "markupPercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "ItemImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ItemImage" ADD CONSTRAINT "ItemImage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

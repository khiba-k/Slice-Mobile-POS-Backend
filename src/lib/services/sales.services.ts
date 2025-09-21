// lib/services/sales.services.ts
import prisma from "@/lib/prisma/prisma";
import { PaymentMethod } from "@prisma/client";
import { SaleStatus } from "@prisma/client";

export interface CreateSaleItemInput {
    itemId: string;
    quantity: number;
}

// Input type for creating a sale(utils/validate.utils.ts)
export interface CreateSaleInput {
    storeId: string;
    cashierId?: string;
    name?: string;
    saleNumber: string;
    status: SaleStatus;
    paymentMethod: PaymentMethod;
    items: CreateSaleItemInput[];
    discountAmount?: number;
}

export interface UpdateSaleItemInput {
    itemId: string;
    quantity: number;
}

// Input type for updating a sale(api/sale/update/[saleId]/draft/route.ts)
export interface UpdateSaleInput {
    cashierId?: string;
    status?: SaleStatus;
    name?: string;
    paymentMethod?: string;
    items?: UpdateSaleItemInput[];
    discountAmount?: number;
}

type ItemWithDetails = {
    itemId: string;
    itemName: string;
    quantity: number;
    sellingPrice: number; // always used for calculations
};

export interface GetCompletedSalesParams {
    storeId: string;
    page?: number;
    take?: number;
}

export interface GetDraftSalesParams {
    storeId: string;
    page?: number;
    take?: number;
}

export interface GetInventoryForSaleParams {
    storeId: string;
    search?: string;
    page?: number;
    take?: number;
}

// Create a new sale(/api/sales/create/[storeId]/route.ts)
export async function createSale(data: CreateSaleInput) {
    try {
        const sale = await prisma.$transaction(async (prismaTx) => {
            // Fetch cashier name if cashierId is provided
            let cashierName = "-";
            if (data.cashierId) {
                const cashier = await prismaTx.user.findUnique({
                    where: { id: data.cashierId },
                    select: { firstName: true },
                });
                if (cashier) cashierName = cashier.firstName;
            }

            // Fetch item names and selling prices from DB
            const itemsWithDetails = await Promise.all(
                data.items.map(async (item) => {
                    const dbItem = await prismaTx.item.findUnique({
                        where: { id: item.itemId },
                        select: { name: true, sellingPrice: true },
                    });

                    if (!dbItem) {
                        throw new Error(`Item not found: ${item.itemId}`);
                    }

                    return {
                        ...item,
                        itemName: dbItem.name,
                        sellingPrice: dbItem.sellingPrice, // override whatever frontend sent
                    };
                })
            );

            // Calculate subtotal & total
            const subtotal = itemsWithDetails.reduce(
                (sum, item) => sum + item.quantity * item.sellingPrice,
                0
            );
            const total = subtotal - (data.discountAmount || 0);

            // Create the sale
            const createdSale = await prismaTx.sale.create({
                data: {
                    storeId: data.storeId,
                    cashierId: data.cashierId,
                    name: data?.name,
                    cashierName,
                    status: data.status,
                    saleNumber: data.saleNumber,
                    paymentMethod: data.paymentMethod,
                    subtotal,
                    discountAmount: data.discountAmount || 0,
                    total,
                    saleItems: {
                        create: itemsWithDetails.map((item) => ({
                            itemId: item.itemId,
                            itemName: item.itemName,
                            quantity: item.quantity,
                            unitPrice: item.sellingPrice,
                            subtotal: item.quantity * item.sellingPrice,
                        })),
                    },
                },
                include: { saleItems: true },
            });

            // Update inventory
            for (const item of itemsWithDetails) {
                if (data.status === "DRAFT") {
                    await prismaTx.item.update({
                        where: { id: item.itemId },
                        data: {
                            qtyAvailable: { decrement: item.quantity },
                            reservedQty: { increment: item.quantity },
                        },
                    });
                } else if (data.status === "COMPLETED") {
                    await prismaTx.item.update({
                        where: { id: item.itemId },
                        data: {
                            qtyAvailable: { decrement: item.quantity },
                        },
                    });
                }
            }

            return createdSale;
        });

        return { success: true, sale };
    } catch (error) {
        console.error("[Create Sale Error]", error);
        return { success: false, error: (error as Error).message };
    }
}

// Update Sale Status (/api/sale/update/[saleId]/draft/route.ts)
export async function updateSale(
    saleId: string,
    data: UpdateSaleInput
) {
    try {
        // Configure transaction with timeout and isolation level
        const updatedSale = await prisma.$transaction(async (prismaTx) => {
            const existingSale = await prismaTx.sale.findUnique({
                where: { id: saleId },
                include: { saleItems: true },
            });

            if (!existingSale) {
                throw new Error("Sale not found");
            }

            // --- Handle cashier name update ---
            let cashierName = existingSale.cashierName;
            if (data.cashierId) {
                const cashier = await prismaTx.user.findUnique({
                    where: { id: data.cashierId },
                    select: { firstName: true },
                });
                if (cashier) cashierName = cashier.firstName;
            }

            // --- Prepare items for update ---
            let itemsWithDetails: ItemWithDetails[] = existingSale.saleItems.map(
                (si) => ({
                    itemId: si.itemId!,
                    itemName: si.itemName,
                    quantity: si.quantity,
                    sellingPrice: si.unitPrice,
                })
            );

            if (data.items) {
                // Fetch DB details for incoming items in batches
                const itemIds = data.items.map(item => item.itemId);
                const dbItems = await prismaTx.item.findMany({
                    where: { id: { in: itemIds } },
                    select: { id: true, name: true, sellingPrice: true },
                });

                // Create a map for faster lookups
                const itemMap = new Map(dbItems.map(item => [item.id, item]));

                const incomingItemsWithDetails = data.items.map((item) => {
                    const dbItem = itemMap.get(item.itemId);
                    if (!dbItem) {
                        throw new Error(`Item not found: ${item.itemId}`);
                    }
                    return {
                        itemId: item.itemId,
                        itemName: dbItem.name,
                        quantity: item.quantity,
                        sellingPrice: dbItem.sellingPrice,
                    };
                });

                // --- Inventory adjustments for draft updates ---
                if (existingSale.status === "DRAFT") {
                    // Batch inventory updates
                    const inventoryUpdates: Array<{ itemId: string, qtyDiff: number }> = [];

                    for (const incomingItem of incomingItemsWithDetails) {
                        const oldItem = existingSale.saleItems.find(
                            (si) => si.itemId === incomingItem.itemId
                        );
                        const oldQty = oldItem?.quantity ?? 0;
                        const diff = incomingItem.quantity - oldQty;

                        if (diff !== 0) {
                            inventoryUpdates.push({
                                itemId: incomingItem.itemId,
                                qtyDiff: diff
                            });
                        }
                    }

                    // Process inventory updates in parallel but with smaller batches
                    const BATCH_SIZE = 10;
                    for (let i = 0; i < inventoryUpdates.length; i += BATCH_SIZE) {
                        const batch = inventoryUpdates.slice(i, i + BATCH_SIZE);
                        await Promise.all(batch.map(update =>
                            prismaTx.item.update({
                                where: { id: update.itemId },
                                data: {
                                    reservedQty: { increment: update.qtyDiff },
                                    qtyAvailable: { decrement: update.qtyDiff },
                                },
                            })
                        ));
                    }

                    // Handle removed items
                    const incomingIds = incomingItemsWithDetails.map((i) => i.itemId);
                    const removedItems = existingSale.saleItems.filter(
                        (si) => !incomingIds.includes(si.itemId!)
                    );

                    if (removedItems.length > 0) {
                        await Promise.all(removedItems.map(item =>
                            prismaTx.item.update({
                                where: { id: item.itemId! },
                                data: {
                                    reservedQty: { decrement: item.quantity },
                                    qtyAvailable: { increment: item.quantity },
                                },
                            })
                        ));
                    }
                }

                // --- Batch update/create sale items ---
                // Delete items that are no longer needed
                const incomingIds = incomingItemsWithDetails.map((i) => i.itemId);
                const itemsToDelete = existingSale.saleItems.filter(
                    (si) => !incomingIds.includes(si.itemId!)
                );

                if (itemsToDelete.length > 0) {
                    await prismaTx.saleItem.deleteMany({
                        where: {
                            id: { in: itemsToDelete.map(item => item.id) }
                        }
                    });
                }

                // Update or create items
                for (const item of incomingItemsWithDetails) {
                    const existingItem = existingSale.saleItems.find(
                        (si) => si.itemId === item.itemId
                    );

                    if (existingItem) {
                        await prismaTx.saleItem.update({
                            where: { id: existingItem.id },
                            data: {
                                quantity: item.quantity,
                                unitPrice: item.sellingPrice,
                                subtotal: item.quantity * item.sellingPrice,
                                itemName: item.itemName,
                            },
                        });
                    } else {
                        await prismaTx.saleItem.create({
                            data: {
                                saleId,
                                itemId: item.itemId,
                                itemName: item.itemName,
                                quantity: item.quantity,
                                unitPrice: item.sellingPrice,
                                subtotal: item.quantity * item.sellingPrice,
                            },
                        });
                    }
                }

                itemsWithDetails = incomingItemsWithDetails;
            }

            // --- Calculate totals ---
            const subtotal = itemsWithDetails.reduce(
                (sum, item) => sum + item.quantity * item.sellingPrice,
                0
            );
            const total =
                subtotal - (data.discountAmount ?? existingSale.discountAmount ?? 0);

            // --- Inventory updates on status change ---
            if (data.status && data.status !== existingSale.status) {
                // DRAFT → COMPLETED
                if (existingSale.status === "DRAFT" && data.status === "COMPLETED") {
                    const reservedQtyUpdates = itemsWithDetails.map(item =>
                        prismaTx.item.update({
                            where: { id: item.itemId },
                            data: { reservedQty: { decrement: item.quantity } },
                        })
                    );
                    await Promise.all(reservedQtyUpdates);
                }
            }

            // --- Update sale ---
            const updated = await prismaTx.sale.update({
                where: { id: saleId },
                data: {
                    name: data.name ?? existingSale.name,
                    cashierId: data.cashierId ?? existingSale.cashierId,
                    cashierName,
                    status: (data.status as SaleStatus) ?? existingSale.status,
                    paymentMethod:
                        (data.paymentMethod as PaymentMethod) ?? existingSale.paymentMethod,
                    subtotal,
                    discountAmount: data.discountAmount ?? existingSale.discountAmount,
                    total,
                },
                include: { saleItems: true },
            });

            return updated;
        }, {
            // Configure transaction options
            maxWait: 5000, // 5 seconds
            timeout: 10000, // 10 seconds
            isolationLevel: 'ReadCommitted' // Less restrictive than default
        });

        return { success: true, sale: updatedSale };
    } catch (error) {
        console.error("[Update Sale Error]", error);

        // Handle specific Prisma errors
        if (error instanceof Error) {
            if (error.message.includes('P2028')) {
                return {
                    success: false,
                    error: "Transaction timed out. Please try again."
                };
            }
            return { success: false, error: error.message };
        }

        return { success: false, error: "Unknown error occurred" };
    }
}

// Get Completed Sale(// api/sale/get/[storeId]/complete/route.ts)
export async function getCompletedSales(params: GetCompletedSalesParams) {
    const { storeId, page = 1, take = 14 } = params;
    const skip = (page - 1) * take;

    try {
        // Fetch completed sales
        const [sales, totalSales] = await Promise.all([
            prisma.sale.findMany({
                where: { storeId, NOT: { status: "DRAFT" } },
                include: { saleItems: true },
                orderBy: { createdAt: "desc" },
                take,
                skip,
            }),
            prisma.sale.count({
                where: { storeId, NOT: { status: "DRAFT" } },
            }),
        ]);

        const totalPages = Math.ceil(totalSales / take);

        return {
            sales,
            meta: {
                page,
                take,
                totalSales,
                totalPages,
                hasNextPage: page < totalPages,
            },
        };
    } catch (error) {
        console.error("[Get Completed Sales Error]", error);
        return {
            sales: [],
            meta: {
                page,
                take,
                totalSales: 0,
                totalPages: 0,
                hasNextPage: false,
            },
        };
    }
}

// Get Completed Sale(// api/sale/get/[storeId]/draft/route.ts)
export async function getDraftSales(params: GetDraftSalesParams) {
    const { storeId, page = 1, take = 14 } = params;
    const skip = (page - 1) * take;

    try {
        // Fetch draft sales only
        const [sales, totalSales] = await Promise.all([
            prisma.sale.findMany({
                where: { storeId, status: "DRAFT" },
                include: { saleItems: true },
                orderBy: { createdAt: "desc" },
                take,
                skip,
            }),
            prisma.sale.count({
                where: { storeId, status: "DRAFT" },
            }),
        ]);

        const totalPages = Math.ceil(totalSales / take);

        return {
            sales,
            meta: {
                page,
                take,
                totalSales,
                totalPages,
                hasNextPage: page < totalPages,
            },
        };
    } catch (error) {
        console.error("[Get Draft Sales Error]", error);
        return {
            sales: [],
            meta: {
                page,
                take,
                totalSales: 0,
                totalPages: 0,
                hasNextPage: false,
            },
        };
    }
}

// Get Sale Inventory Items(// api/sale/inventory/[storeId]/route.ts)
export async function getInventoryForSale(storeId: string) {
    try {
        const items = await prisma.item.findMany({
            where: { storeId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                itemNumber: true,
                name: true,       // itemName
                unitSize: true,
                unitType: true,
                qtyAvailable: true,
                sellingPrice: true,
                images: {
                    where: { isDisplayImage: true },
                    select: { url: true, isDisplayImage: true },
                },
            },
        });

        return { items };
    } catch (error) {
        console.error("[Get Inventory For Sale Error]", error);
        return { items: [] };
    }
}
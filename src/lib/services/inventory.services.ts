// lib/services/item.services.ts

import prisma from "@/lib/prisma/prisma";
import { uploadImage } from "../supabase/uploadImage";

export type ImageInput = {
    id?: string;
    url: string;
    isDisplayImage?: boolean;
  };

export interface CreateItemInput {
    itemNumber: string;
    itemType: string;
    departmentName: string;
    name: string;
    description?: string;
    unitSize?: string;
    unitType?: string;
    qtyAvailable?: number;
    lowStockAlertQty?: number;
    sellingPrice: number;
    costPrice?: number;
    markupPercentage?: number;
    storeId: string;
    images?: ImageInput[];
}

export interface GetItemsParams {
    storeId: string,
    search?: string;
    itemType?: string;
    departmentName?: string;
    page?: number; // for pagination
    take?: number; // items per page
}

interface AddItemImageProps {
    itemId: string;
    file: File | Buffer; // depending on how you send it
    fileName?: string;
    isDisplayImage?: boolean;
}

// Check for existing item to prevent duplicates(/api/inventory/add/[storeId]/route.ts)
export async function getExistingItem(item: CreateItemInput) {
    try {
        return await prisma.item.findFirst({
            where: {
                itemType: item.itemType,
                departmentName: item.departmentName,
                name: item.name,
                unitSize: item.unitSize || null,
                unitType: item.unitType || null,
            },
        });
    } catch (error) {
        console.error("[Get Existing Item Error]", error);
        return null;
    }
}

// Get the last item number to generate a new one(/api/inventory/add/[storeId]/route.ts)
export async function getLastItemNumber() {
    try {
        const lastItem = await prisma.item.findFirst({
            orderBy: { createdAt: "desc" },
            select: { itemNumber: true },
        });
        return lastItem?.itemNumber ?? null;
    } catch (error) {
        console.error("[Get Last Item Number Error]", error);
        return null;
    }
}

// Create a new item in the inventory(/api/inventory/add/[storeId]/route.ts)
export async function createItem(data: CreateItemInput & {
    images?: { url: string; isDisplayImage: boolean }[];
}) {
    try {
        const item = await prisma.item.create({
            data: {
                itemNumber: data.itemNumber,
                itemType: data.itemType,
                departmentName: data.departmentName,
                name: data.name,
                description: data.description,
                unitSize: data.unitSize,
                unitType: data.unitType,
                qtyAvailable: data.qtyAvailable ?? 0,
                lowStockAlertQty: data.lowStockAlertQty,
                sellingPrice: data.sellingPrice,
                costPrice: data.costPrice,
                markupPercentage: data.markupPercentage,
                storeId: data.storeId,

                // 👇 relation for images if provided
                images: data.images
                    ? {
                        create: data.images.map((img) => ({
                            url: img.url,
                            isDisplayImage: img.isDisplayImage,
                        })),
                    }
                    : undefined,
            },
            include: { images: true },
        });

        return { success: true, item };
    } catch (error: any) {
        console.error("[Create Item Error]:", error);
        return { success: false, error: error.message };
    }
}


// Get items with search, filter, and pagination(/api/inventory/get/[storeId]route.ts)
export async function getItems(params: GetItemsParams) {
    const { storeId, search, itemType, departmentName, page = 1, take = 14 } = params;

    const skip = (page - 1) * take;

    // Build dynamic "where" clause
    const where: any = {
        storeId,
        AND: []
    };

    if (search) {
        where.AND.push({
            OR: [
                { itemNumber: { contains: search, mode: "insensitive" } },
                { departmentName: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { unitSize: { contains: search, mode: "insensitive" } },
                { unitType: { contains: search, mode: "insensitive" } },
            ],
        });
    }

    if (itemType) {
        where.AND.push({ itemType });
    }

    if (departmentName) {
        where.AND.push({ departmentName });
    }

    try {
        const [items, totalItems] = await Promise.all([
            prisma.item.findMany({
                where,
                take,
                skip,
                orderBy: { createdAt: "desc" },
                include: { images: true },
            }),
            prisma.item.count({ where })
        ]);

        const totalPages = Math.ceil(totalItems / take);

        return {
            items,
            meta: {
                page,
                take,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
            },
        };
    } catch (error) {
        console.error("[Get Items Error]", error);
        return {
            items: [],
            meta: {
                page,
                take,
                totalItems: 0,
                totalPages: 0,
                hasNextPage: false,
            },
        };
    }
}

// Add image to an item (/api/inventory/add/images/[itemId]/route.ts)
export async function addItemImage(itemId: string, file: File, isDisplayImage = false) {
    try {
        // Upload the file to Supabase
        const uploadResult = await uploadImage({
            file,
            bucket: "item-images", // adjust bucket name as needed
            folder: "inventory"
        });

        if (uploadResult.error) {
            throw new Error(uploadResult.error);
        }

        // Store in DB
        const image = await prisma.itemImage.create({
            data: {
                url: uploadResult.imageUrl,
                itemId,
                isDisplayImage,
            },
        });

        return image;
    } catch (error) {
        console.error('Error in addItemImage:', error);
        throw error;
    }
}

// Get item by ID to verify existance (/api/inventory/add/images/[itemId]/route.ts)
export async function getItemById(itemId: string) {
    try {
        const item = await prisma.item.findUnique({
            where: {
                id: itemId
            },
        });

        return item;
    } catch (error) {
        console.error('Error getting item by ID:', error);
        throw error;
    }
}

// Create ItemTypeDepartment Combo if not exists(/api/inventory/add/[storeId]/route.ts)
export async function ensureItemTypeDepartment(storeId: string, itemType: string, departmentName: string) {
    try {
        await prisma.itemTypeDepartment.upsert({
            where: {
                itemType_departmentName_storeId: {
                    itemType,
                    departmentName,
                    storeId,
                },
            },
            update: {}, // nothing to update if it exists
            create: {
                storeId,
                itemType,
                departmentName,
            },
        });
    } catch (error) {
        throw new Error("Failed to ensure ItemTypeDepartment: " + (error as Error).message);
    }
}

// Get a specific stores ItemDepartment combo (api/inventory/filters/[storeId]/route.ts)
export async function getItemTypeDepartmentsByStore(storeId: string) {
    try {
        return await prisma.itemTypeDepartment.findMany({
            where: { storeId },
            orderBy: [{ itemType: "asc" }, { departmentName: "asc" }],
        });
    } catch (error) {
        throw new Error("Failed to fetch ItemTypeDepartments: " + (error as Error).message);
    }
}

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma/prisma";
import {
    badRequest,
    notFound,
    success,
    serverError,
} from "@/utils/response.handler";
import { CreateItemInput, ImageInput } from "@/lib/services/inventory.services";


export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    const { itemId } = await params;

    try {
        const body: Partial<CreateItemInput> = await req.json();

        if (!body || Object.keys(body).length === 0) {
            return badRequest("No update data provided");
        }

        const existingItem = await prisma.item.findUnique({
            where: { id: itemId },
            include: { images: true },
        });

        if (!existingItem) {
            return notFound("Item not found");
        }

        // Step 1: Work with images
        const incomingImages: ImageInput[] = body.images ?? [];
        const incomingImageIds = incomingImages
            .filter((img: ImageInput) => img.id)
            .map((img: ImageInput) => img.id as string);

        // Step 2: Delete images not in the new list
        const imagesToDelete = existingItem.images.filter(
            (img) => !incomingImageIds.includes(img.id)
        );

        if (imagesToDelete.length > 0) {
            await prisma.itemImage.deleteMany({
                where: { id: { in: imagesToDelete.map((img) => img.id) } },
            });
        }

        // Step 3: Add new images (those without IDs)
        const newImages = incomingImages.filter((img: ImageInput) => !img.id);
        if (newImages.length > 0) {
            await prisma.itemImage.createMany({
                data: newImages.map((img: ImageInput) => ({
                    url: img.url,
                    isDisplayImage: img.isDisplayImage ?? false,
                    itemId,
                })),
            });
        }

        // Step 4: Update the item itself (without images to avoid clobbering relations)
        const { images: _images, ...itemDataWithoutImages } = body;

        const updatedItem = await prisma.item.update({
            where: { id: itemId },
            data: {
                ...itemDataWithoutImages,
            },
            include: { images: true },
        });

        return success(updatedItem, "Item updated successfully");
    } catch (error) {
        return serverError("Failed to update item", error as Error);
    }
}
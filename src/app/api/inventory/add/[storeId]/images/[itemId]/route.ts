// api/inventory/add/[storeId]/images/[itemId]/route.ts

import { addItemImage, getItemById } from "@/lib/services/inventory.services";
import { badRequest, created, notFound, serverError } from "@/utils/response.handler";

export async function POST(req: Request, { params }: { params: { itemId: string } }) {
    try {
        const { itemId } = params;

        // Validate itemId exists
        const existingItem = await getItemById(itemId);
        if (!existingItem) {
            return notFound(`Item with ID ${itemId} not found`);
        }

        // Parse form data for file uploads
        const formData = await req.formData();

        // Get image files and metadata from form data
        const imageFiles: File[] = [];
        const imageMetadata: Array<{ isDisplayImage: boolean }> = [];

        // Extract images and their metadata
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('image-')) {
                imageFiles.push(value as File);
            }
            if (key.startsWith('imageData-')) {
                imageMetadata.push(JSON.parse(value as string));
            }
        }

        // Validate at least one image is provided
        if (imageFiles.length === 0) {
            return badRequest("At least one image file is required");
        }

        // Upload and store images
        const uploadedImages = [];
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const metadata = imageMetadata[i] || { isDisplayImage: false };

            try {
                const image = await addItemImage(
                    itemId,
                    file,
                    metadata.isDisplayImage
                );
                uploadedImages.push(image);
            } catch (imageError) {
                console.error(`Error uploading image ${i}:`, imageError);
                // Continue with other images even if one fails
            }
        }

        if (uploadedImages.length === 0) {
            return serverError("Failed to upload any images");
        }

        return created(uploadedImages, `Successfully uploaded ${uploadedImages.length} image(s)`);
    } catch (error) {
        return serverError("Unexpected error", error as Error);
    }
}
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { badRequest, notFound, success, serverError } from "@/utils/response.handler";
import { CreateItemInput } from "@/lib/services/inventory.services";

export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
    const { itemId } = params;

    try {
        const body: Partial<CreateItemInput> = await req.json();

        if (!body || Object.keys(body).length === 0) {
            return badRequest("No update data provided");
        }

        const existingItem = await prisma.item.findUnique({ where: { id: itemId } });
        if (!existingItem) {
            return notFound("Item not found");
        }

        const updatedItem = await prisma.item.update({
            where: { id: itemId },
            data: { ...body },
        });

        return success(updatedItem, "Item updated successfully");
    } catch (error) {
        return serverError("Failed to update item", error as Error);
    }
}

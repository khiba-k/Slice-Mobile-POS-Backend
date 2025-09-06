import { NextRequest } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { notFound, success, serverError } from "@/utils/response.handler";

export async function DELETE(req: NextRequest, { params }: { params: { itemId: string } }) {
    const { itemId } = params;

    try {
        const existingItem = await prisma.item.findUnique({ where: { id: itemId } });
        if (!existingItem) {
            return notFound("Item not found");
        }

        await prisma.item.delete({ where: { id: itemId } });

        return success(null, "Item deleted successfully");
    } catch (error) {
        return serverError("Failed to delete item", error as Error);
    }
}

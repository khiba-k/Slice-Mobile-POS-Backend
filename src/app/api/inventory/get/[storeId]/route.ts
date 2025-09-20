// app/api/inventory/get/[storeId]/route.ts
import { getItems } from "@/lib/services/inventory.services";
import { success, serverError } from "@/utils/response.handler";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { search, itemType, departmentName, page } = Object.fromEntries(
            new URL(req.url).searchParams
        );

        const itemsWithMeta = await getItems({
            storeId,
            search: search as string,
            itemType: itemType as string,
            departmentName: departmentName as string,
            page: page ? Number(page) : 1,
        });

        return success(itemsWithMeta, "Items fetched successfully");
    } catch (error) {
        return serverError("Failed to fetch items", error as Error);
    }
}
// api/sale/inventory/[storeId]/route.ts
import { getInventoryForSale } from "@/lib/services/sales.services";
import { success, serverError } from "@/utils/response.handler";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;

        const result = await getInventoryForSale(storeId);

        return success(result, "Inventory fetched successfully");
    } catch (error) {
        return serverError("Failed to fetch inventory", error as Error);
    }
}

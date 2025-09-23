// api/insights/inventory/[storeId]/[idemId]/route.ts

import { getInventoryInsights } from "@/lib/services/insights.services";
import { success, serverError } from "@/utils/response.handler";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string; itemId: string }> }
) {
    try {
        const { storeId, itemId } = await params;

        const data = await getInventoryInsights({ storeId, itemId });

        return success(data, "Inventory insights fetched successfully");
    } catch (error) {
        return serverError("Failed to fetch inventory insights", error as Error);
    }
}

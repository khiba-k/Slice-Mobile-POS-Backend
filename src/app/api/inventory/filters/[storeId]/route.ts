// /api/inventory/filters/[storeId]/route.ts
import { getItemTypeDepartmentsByStore } from "@/lib/services/inventory.services";
import { badRequest, serverError, success } from "@/utils/response.handler";

export async function GET(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
    try {
        const { storeId } = await params;

        if (!storeId) {
            return badRequest("storeId is required");
        }

        const filters = await getItemTypeDepartmentsByStore(storeId);

        return success(filters, "Filters fetched successfully");
    } catch (error) {
        return serverError("Unexpected error", error as Error);
    }
}
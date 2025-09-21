// api/sale/get/[storeId]/complete/route.ts
import { getCompletedSales } from "@/lib/services/sales.services";
import { success, serverError } from "@/utils/response.handler";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { page } = Object.fromEntries(new URL(req.url).searchParams);

        const result = await getCompletedSales({
            storeId,
            page: page ? Number(page) : 1,
        });

        return success(result, "Completed sales fetched successfully");
    } catch (error) {
        return serverError("Failed to fetch completed sales", error as Error);
    }
}
// api/sale/get/[storeId]/draft/route.ts
import { getDraftSales } from "@/lib/services/sales.services";
import { success, serverError } from "@/utils/response.handler";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { page } = Object.fromEntries(new URL(req.url).searchParams);

        const result = await getDraftSales({
            storeId,
            page: page ? Number(page) : 1,
        });

        return success(result, "Draft sales fetched successfully");
    } catch (error) {
        return serverError("Failed to fetch draft sales", error as Error);
    }
}

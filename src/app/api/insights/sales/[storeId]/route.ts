// api/insights/sales/[storeId]/route.ts
import { getSalesInsights } from "@/lib/services/insights.services";
import { success, serverError } from "@/utils/response.handler";


export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { range } = Object.fromEntries(new URL(req.url).searchParams);

        // Default to this_week if no range provided
        const timeRange = (range as "today" | "this_week" | "this_month" | "this_year") || "this_week";

        const data = await getSalesInsights({ storeId, range: timeRange });

        return success(data, "Sales insights fetched successfully");
    } catch (error) {
        return serverError("Failed to fetch sales insights", error as Error);
    }
}

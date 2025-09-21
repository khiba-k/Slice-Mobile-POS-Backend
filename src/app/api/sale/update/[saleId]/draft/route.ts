import {
    success,
    badRequest,
    notFound,
    serverError,
} from "@/utils/response.handler";
import { updateSale, UpdateSaleInput } from "@/lib/services/sales.services";

interface RouteContext {
    params: Promise<{ saleId: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
    try {
        const { saleId } = await context.params;
        if (!saleId) return badRequest("Sale ID is required");

        const body: Partial<UpdateSaleInput> = await req.json();

        const result = await updateSale(saleId, body);

        if (!result.success) {
            if (result.error === "Sale not found") return notFound(result.error);
            return serverError("Failed to update sale", result.error);
        }

        return success(result.sale, "Sale updated successfully");
    } catch (error) {
        console.error("[API Update Sale Error]", error);
        return serverError("Unexpected error", error as Error);
    }
}

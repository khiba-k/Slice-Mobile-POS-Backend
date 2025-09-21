// app/api/sales/add/[storeId]/route.ts
import prisma from "@/lib/prisma/prisma";
import { serverError, badRequest, created } from "@/utils/response.handler";
import { validateCreateSale } from "@/utils/validate.utils";
import { createSale } from "@/lib/services/sales.services";

interface RouteContext {
    params: Promise<{ storeId: string }>;
}

async function getLastSaleNumber(storeId: string) {
    const lastSale = await prisma.sale.findFirst({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        select: { saleNumber: true },
    });
    return lastSale?.saleNumber ?? null;
}

export async function POST(req: Request, context: RouteContext) {
    try {
        const { storeId } = await context.params;
        const body = await req.json();

        // add storeId to body for validation & service
        const saleData = { ...body, storeId };

        // validate
        const validationError = validateCreateSale(saleData);
        if (validationError) return badRequest(validationError);

        // generate sale number
        const lastNumber = await getLastSaleNumber(storeId);
        const nextNumber = (parseInt(lastNumber || "0", 10) + 1).toString().padStart(4, "0");

        // attach generated saleNumber to body
        saleData.saleNumber = nextNumber;

        const result = await createSale(saleData);
        if (!result.success) return serverError("Failed to create sale", result.error);

        return created(result.sale, "Sale created successfully");
    } catch (error) {
        console.error("[API Create Sale Error]", error);
        return serverError("Unexpected error", error as Error);
    }
}
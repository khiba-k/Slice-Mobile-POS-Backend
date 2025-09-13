// app/api/inventory/add/[storeId]/route.ts
import {
    createItem,
    ensureItemTypeDepartment,
    getExistingItem,
    getLastItemNumber,
} from "@/lib/services/inventory.services";
import {
    badRequest,
    conflict,
    created,
    serverError,
} from "@/utils/response.handler";
import { validateCreateItem } from "@/utils/validate.utils";

export async function POST(req: Request, { params }: { params: { storeId: string } }) {
    try {
        const body = await req.json();
        const { storeId } = params;

        // ✅ Now body includes `images: [{ url, isDisplayImage }]`
        const isNotValid = validateCreateItem(body);
        if (isNotValid) return badRequest(isNotValid);

        const { itemType, departmentName } = body;
        await ensureItemTypeDepartment(storeId, itemType, departmentName);

        const existingItem = await getExistingItem(body);
        if (existingItem) {
            return conflict(
                `This item already exists, check item number: ${existingItem.itemNumber}`
            );
        }

        const lastNumber = await getLastItemNumber();
        const nextNumber = (parseInt(lastNumber || "0", 10) + 1)
            .toString()
            .padStart(4, "0");

        const result = await createItem({
            ...body,
            storeId,
            itemNumber: nextNumber,
        });

        if (!result.success) {
            return serverError("Unexpected error", result.error);
        }

        return created(result.item, "Item created successfully");
    } catch (error) {
        return serverError("Unexpected error", error as Error);
    }
}

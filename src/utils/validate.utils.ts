import { CreateItemInput } from "@/lib/services/inventory.services";
import { CreateSaleInput } from "@/lib/services/sales.services";
import { CreateUserInput, CreateStoreInput } from "@/lib/services/user.services";

interface CreateUserAndStoreInput extends CreateUserInput {
    storeData: CreateStoreInput;
}

// Validate required fields for creating a user + store (/api/user/create/owner/route.ts)
export const validateCreateUser = (user: CreateUserAndStoreInput) => {
    if (!user.userId) return "User ID is required";
    if (!user.firstName) return "First name is required";
    if (!user.lastName) return "Last name is required";
    if (!user.email) return "Email is required";
    if (!user.idNumber) return "ID number is required";
    if (!user.dateOfBirth) return "Date of birth is reuired";
    if (!user.primaryPhoneNum) return "Primary phone number is required";

    if (!user.storeData?.name) return "Store name is required";
    if (!user.storeData?.industry) return "Industry is required";
    if (!user.storeData?.location) return "Location is required";
    if (!user.storeData?.district) return "District is required";
    if (!user.storeData?.country) return "Country is required";

    return null;
};

// Validate required fields for creating an item (/api/inventory/add/[storeId]route.ts)
export const validateCreateItem = (item: CreateItemInput) => {
    if (!item.itemType) return "Item type is required";
    if (!item.departmentName) return "Department name is required";
    if (!item.name) return "Item name is required";
    if (!item.sellingPrice) return "Selling price is required";

    return null;
};

// Validate required fields for creating a sale (/api/sales/create/[storeId]/route.ts)
export const validateCreateSale = (sale: CreateSaleInput) => {
    if (!sale.storeId) return "Store ID is required";
    if (!sale.cashierId) return "Cashier ID is required";
    if (!sale.items || sale.items.length === 0) return "At least one sale item is required";
    if (!sale.status) return "Sale status is required";

    return null;
};
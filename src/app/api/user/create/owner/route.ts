import { checkUserByIdNumber, createUser, getUserByUserId, createStore } from "@/lib/services/user.services";
import { badRequest, conflict, created, serverError } from "@/utils/response.handler";
import { validateCreateUser } from "@/utils/validate.utils";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            userId,
            idNumber,
            storeData,
            ...userData
        } = body;

        // Validate required fields
        const isNotValid = validateCreateUser(body);
        if (isNotValid) {
            return badRequest(isNotValid);
        }

        // Check if user already exists
        const existingUser = await getUserByUserId(userId);
        if (existingUser) {
            return conflict("User already exists");
        }

        // Check if ID number already exists
        const conflictIdNumber = await checkUserByIdNumber(idNumber);
        if (conflictIdNumber) {
            return conflict(
                "This ID cannot be used. Please check your details or contact support if you believe this is an error."
            );
        }

        // Create the Store first
        const storeRes = await createStore(storeData);
        if (!storeRes.success) {
            return serverError("Failed to create store", storeRes.error);
        }

        // Create the User, linked to the store
        userData.userId = userId;
        userData.idNumber = idNumber;
        const result = await createUser({
            ...userData,
            storeId: storeRes.store?.id,
        });

        if (result.error) {
            return serverError("Unexpected error creating user", result.error);
        }

        return created(
            { user: result.user, store: storeRes.store },
            "Owner and store created successfully"
        );
    } catch (error) {
        return serverError("Unexpected error", error as Error);
    }
}

import prisma from "@/lib/prisma/prisma";

export interface CreateUserInput {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    idNumber: string;
    dateOfBirth: Date;
    primaryPhoneNum: string;
    secondaryPhoneNum?: string;
    isOwner?: boolean;
    storeId?: string;
}

export interface CreateStoreInput {
    name: string;
    industry: string;
    location: string;
    district: string;
    country: string;
}

// Check if a user exists by userId(api/user/create/route.ts)
export async function getUserByUserId(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { userId: userId },
            include: { store: true },
        });
        return user;
    } catch (error) {
        console.error("[Get User By UserId Error]", error);
        return null;
    }
}

// Create a new user (api/user/create/route.ts)
export async function createUser(data: CreateUserInput) {
    try {
        const user = await prisma.user.create({
            data: {
                ...data,
                store: data.storeId ? { connect: { id: data.storeId } } : undefined,
                storeId: undefined, // explicitly set storeId to undefined
            },
        });

        return { success: true, user };
    } catch (error: any) {
        console.error("[Create User Error]:", error);
        return { success: false, error: error.message };
    }
}

// 
export async function createStore(data: CreateStoreInput) {
    try {
        const store = await prisma.store.create({
            data: {
                ...data,
            },
        });

        return { success: true, store };
    } catch (error: any) {
        console.error("[Create Store Error]:", error);
        return { success: false, error: error.message };
    }
}

// Check if user with the same ID number exists (api/user/create/route.ts)
export async function checkUserByIdNumber(idNumber: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { idNumber },
        });
        return user;
    } catch (error) {
        console.error("[Check User By ID Number Error]", error);
        return null;
    }
}
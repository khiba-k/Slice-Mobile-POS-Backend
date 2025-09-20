// app/api/user/get/[userId]/route.ts

import { NextRequest } from "next/server";
import { getUserByUserId } from "@/lib/services/user.services";
import { badRequest, notFound, success, serverError } from "@/utils/response.handler";

interface Params {
    params: Promise<{
        userId: string;
    }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { userId } = await params;

        if (!userId) {
            return badRequest("Missing userId");
        }

        const user = await getUserByUserId(userId);

        if (!user) {
            return notFound("User not found");
        }

        return success(user, "User fetched successfully");
    } catch (error) {
        return serverError("Failed to fetch user", error as Error);
    }
}
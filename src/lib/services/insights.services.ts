import prisma from "@/lib/prisma/prisma";

// Fetch inventory insights for a specific item(api/insights/inventory/[storeId]/[itemId])
export async function getInventoryInsights({
    storeId,
    itemId,
}: {
    storeId: string;
    itemId: string;
}) {
    // Helper function to get start/end of week & month
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday = 0
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Fetch sales for the current week
    const weekSales = await prisma.saleItem.findMany({
        where: {
            itemId,
            sale: {
                storeId,
                status: "COMPLETED",
                createdAt: { gte: startOfWeek, lte: now },
            },
        },
        select: {
            quantity: true,
            subtotal: true,
            sale: { select: { createdAt: true } },
        },
    });

    // Fetch sales for the current month
    const monthSales = await prisma.saleItem.findMany({
        where: {
            itemId,
            sale: {
                storeId,
                status: "COMPLETED",
                createdAt: { gte: startOfMonth, lte: now },
            },
        },
        select: {
            quantity: true,
            subtotal: true,
            sale: { select: { createdAt: true } },
        },
    });

    // Aggregate totals
    const totalUnitsSold = monthSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalMoneyEarned = monthSales.reduce((sum, s) => sum + s.subtotal, 0);

    // Helper: aggregate per day for chart
    const aggregateByDay = (sales: typeof weekSales) => {
        const map: Record<string, { units: number; money: number }> = {};

        sales.forEach(({ quantity, subtotal, sale }) => {
            const day = sale.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
            if (!map[day]) map[day] = { units: 0, money: 0 };
            map[day].units += quantity;
            map[day].money += subtotal;
        });

        return Object.entries(map).map(([day, { units, money }]) => ({
            day,
            units,
            money,
        }));
    };

    return {
        week: aggregateByDay(weekSales),
        month: aggregateByDay(monthSales),
        totalUnitsSold,
        totalMoneyEarned,
    };
}

// Helper to get start & end dates based on range (api/insights/sales/[storeId]?range=)
function getDateRange(range: "today" | "this_week" | "this_month" | "this_year") {
    const now = new Date();
    let startDate: Date;
    const endDate = now;

    switch (range) {
        case "today":
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
        case "this_week":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay()); // Sunday = 0
            startDate.setHours(0, 0, 0, 0);
            break;
        case "this_month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case "this_year":
            startDate = new Date(now.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        default:
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
}

// Fetch sales insights for a store
export async function getSalesInsights({
    storeId,
    range,
}: {
    storeId: string;
    range: "today" | "this_week" | "this_month" | "this_year";
}) {
    const { startDate, endDate } = getDateRange(range);

    // Fetch completed sales in the given range
    const sales = await prisma.sale.findMany({
        where: {
            storeId,
            status: "COMPLETED",
            createdAt: { gte: startDate, lte: endDate },
        },
        select: {
            total: true,
            createdAt: true,
        },
    });

    // Total money generated
    const totalMoney = sales.reduce((sum, s) => sum + s.total, 0);

    // Aggregate by day for chart
    const map: Record<string, number> = {};
    sales.forEach(({ total, createdAt }) => {
        const day = createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
        map[day] = (map[day] || 0) + total;
    });

    const dailyTotals = Object.entries(map).map(([day, totalRevenue]) => ({
        day,
        totalRevenue,
    }));

    return {
        totalMoneyGenerated: totalMoney,
        dailyTotals,
    };
}

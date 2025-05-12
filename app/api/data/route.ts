import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const symbols = searchParams.get("symbols"); // Comma-separated symbols
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!symbols || !start || !end) {
            return NextResponse.json({ error: "Missing required query parameters: symbols, start, end" }, { status: 400 });
        }

        const symbolList = symbols.split(","); // Convert to array
        const results: any = {};

        // Fetch data for each stock symbol
        for (const symbol of symbolList) {
            const data = await yahooFinance.historical(symbol, {
                period1: start,
                period2: end,
                interval: "1wk", // Weekly data
                
            });
            console.log(data)
            // Format the data
            results[symbol] = data.map((item) => ({
                date: item.date,
                close: item.close,
                changePercent: item.close && item.open ? ((item.close - item.open) / item.open) * 100 : null,
            }));
        }

        return NextResponse.json(results, { status: 200 });
    } catch (error) {
        console.error("Error fetching stock data:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

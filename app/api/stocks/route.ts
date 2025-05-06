import { NextResponse } from "next/server";
import { getStockData } from "../../lib/getData";

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stockSymbols = searchParams.get("stockSymbols")?.split(",") || [];
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const interval = searchParams.get("interval");
    console.log(searchParams);
    const stocks = await getStockData(
      stockSymbols,
      startDate,
      endDate,
      interval as "1d" | "1wk" | "1mo"
    );
    return NextResponse.json(
      { stocks },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}

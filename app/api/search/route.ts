import yahooFinance from "yahoo-finance2";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const result = await yahooFinance.search(query, {
      quotesCount: 5,
      newsCount: 0,
      enableNavLinks: false,
      enableEnhancedTrivialQuery: false,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Yahoo Finance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

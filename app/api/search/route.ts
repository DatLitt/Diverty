import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get('region') || 'US';

  try {
    const trending = await yahooFinance.trendingSymbols(region);
    return NextResponse.json({ quotes: trending.quotes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
  }
}

// lib/getTrendingStocks.ts

// export async function getTrendingStocks(region: string) {
//   const res = await fetch(`/api/search?region=${region}`, {
//     cache: 'force-cache',
//   });

//   if (!res.ok) throw new Error('Failed to fetch trending stocks');

//   const data = await res.json();
//   return data.quotes || [];
// }
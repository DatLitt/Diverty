import { NextResponse } from 'next/server';
import { getStockData } from '../../lib/getData';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const stocks = await getStockData();
    return NextResponse.json({ stocks }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
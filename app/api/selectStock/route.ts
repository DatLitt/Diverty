import yahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol'); // e.g., AAPL

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    const quote = await yahooFinance.quote(symbol);
    const profile = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile'] });

    const response = {
      symbol: quote.symbol,
      shortName: quote.shortName,
      price: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent,
      sector: profile.assetProfile?.sector,
      industry: profile.assetProfile?.industry,
      website: profile.assetProfile?.website
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}
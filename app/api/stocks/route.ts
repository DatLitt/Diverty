import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET() {
  const tickers = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'META', 'TSLA', 'BRK-A'];
  const start = new Date();
  start.setFullYear(start.getFullYear() - 5);
  const end = new Date();

  const data = await Promise.all(
    tickers.map(async (ticker) => {
      // Fetch daily historical data for the given period
      const result = await yahooFinance.historical(ticker, {
        period1: start.toISOString().split('T')[0],
        period2: end.toISOString().split('T')[0],
        interval: '1d',
      });
    
      // Filter only Fridays
      const allFridays = result.filter((d) => new Date(d.date).getDay() === 5);
  
      // Collect the last Friday of each week
      const fridays: typeof result = [];
      let lastWeek: string | null = null;
      allFridays.forEach((d) => {
        const date = new Date(d.date);
        const weekNumber = date.getFullYear() + '-' + Math.ceil(date.getDate() / 7); // Unique key per week
        if (lastWeek !== weekNumber) {
          fridays.push(d);
          lastWeek = weekNumber;
        }
      });
  
      // Calculate changePercent for each Friday entry
      const processed = fridays.map((d, i, arr) => {
        if (i === 0) {
          return {
            date: d.date,
            close: d.close,
            changePercent: 0,
          };
        }
        const prevClose = arr[i - 1].close;
        const changePercent = ((d.close - prevClose) / prevClose) * 100;
        return {
          date: d.date,
          close: d.close,
          changePercent: Number(changePercent.toFixed(2)),
        };
      });
  
      return { ticker, data: processed };
    })
  );
  
  
  

  return NextResponse.json({ stocks: data });
}
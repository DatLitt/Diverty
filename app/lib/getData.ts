import yahooFinance from 'yahoo-finance2';
import { cache } from 'react';

export const getStockData = cache(async () => {
  const tickers = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'META', 'TSLA', 'BRK-A'];
  const start = "2017-12-15";
  //start.setFullYear(start.getFullYear() - 5);
  const end = "2022-12-16";

  const data = await Promise.all(
    tickers.map(async (ticker) => {
      const result = await yahooFinance.historical(ticker, {
        period1: start,
        period2: end,
        interval: '1d',
      });
    
      const allFridays = result.filter((d) => new Date(d.date).getDay() === 5);
      const fridays: typeof result = [];
      let lastWeek: string | null = null;

      // ...existing friday filtering logic...
      allFridays.forEach((d) => {
        const date = new Date(d.date);
        const weekNumber = date.getFullYear() + '-' + Math.ceil(date.getDate() / 7);
        if (lastWeek !== weekNumber) {
          fridays.push(d);
          lastWeek = weekNumber;
        }
      });
  
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

  return data;
});
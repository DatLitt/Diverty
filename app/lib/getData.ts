import yahooFinance from 'yahoo-finance2';
import { cache } from 'react';

export const getStockData = cache(async (stockSymbols: string[], startDate: string, endDate: string, interval: "1d" | "1wk" | "1mo") => {
  const tickers = stockSymbols.length > 0 ? stockSymbols : [];
 

  const data = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const result = await yahooFinance.historical(ticker, {
        period1: startDate,
        period2: endDate,
        interval: interval,
      });
    
      const processed = result.map((d, i, arr) => {
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
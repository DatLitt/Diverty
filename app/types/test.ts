export interface Stock {
  ticker?: string;
  data?: { changePercent: number,
    date: Date,
    close: number
   }[]; 
  symbol?: string;
  shortName?: string;
}

export interface Portfolio {
  weights: number[];
  meanReturn: number;
  stdDev: number;
  fitness: number;
}
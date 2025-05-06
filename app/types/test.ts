export interface Stock {
  ticker?: string;
  data?: { changePercent: number; date: Date; close: number }[];
  symbol?: string;
  shortName?: string;
}

export interface StockDetails {
  symbol: string;
  shortname: string;
  price?: number;
  changePercent?: number;
  exchange: string;
  sector?: string;
  industry?: string;
  website?: string;
  quoteType?: string;
}

export interface Portfolio {
  weights: number[];
  meanReturn: number;
  stdDev: number;
  fitness: number;
}

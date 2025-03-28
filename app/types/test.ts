export default interface Stock {
  ticker?: string;
  data?: { changePercent: number,
    date: Date,
    close: number
   }[]; 
  symbol?: string;
  shortName?: string;
}
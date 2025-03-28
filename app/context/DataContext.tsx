'use client';
import {Portfolio, Stock} from '../types/test';
import { createContext, useContext, useState } from 'react';

type DataContextType = {
  data: Stock[];
  result: {ticker: string, weight: number}[];
  bestPortfolio: Portfolio;
  setData: React.Dispatch<React.SetStateAction<Stock[]>>;
  setResults: React.Dispatch<React.SetStateAction<{ticker: string, weight: number}[]>>;
  setPortfolio: React.Dispatch<React.SetStateAction<Portfolio>>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Stock[]>([]);
  const [result, setResults] = useState<{ticker: string, weight: number}[]>([]);
  const [bestPortfolio, setPortfolio] = useState<Portfolio>({} as Portfolio);
  

  return (
    <DataContext.Provider value={{ data, result, bestPortfolio, setData, setResults, setPortfolio }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useCount must be used within a CountProvider');
  }
  return context;
};
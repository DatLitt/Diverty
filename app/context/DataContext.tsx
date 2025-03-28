'use client';
import Stock from '@/types/test';
import { createContext, useContext, useState } from 'react';

type DataContextType = {
  data: Stock[];
  setData: React.Dispatch<React.SetStateAction<Stock[]>>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Stock[]>([]);
  

  return (
    <DataContext.Provider value={{ data, setData }}>
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
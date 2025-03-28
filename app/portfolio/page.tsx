"use client";
import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import Link from "next/link";
import {Stock} from "../types/test";
import { calculateReturns, meanReturns, covarianceMatrix } from "../utils/mpt";
import { geneticOptimization } from "../utils/optimizer";


export default function Portfolio() {
  const { data, result, bestPortfolio, setData, setResults, setPortfolio } = useData();
  const [best, setBest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Component mounted", new Date().toISOString());
    return () => {
      console.log("Component unmounted", new Date().toISOString());
    };
  }, [data]);
  const calculate = async (data: Stock[]) => {
    console.log("Calculating portfolio...");
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("No data available for calculations");
      return null;
    }

    try {
      // Validate that all stocks have data
      const validData = data.every(
        (stock) =>
          stock &&
          stock.data &&
          Array.isArray(stock.data) &&
          stock.data.length > 0
      );

      if (!validData) {
        console.log("Invalid stock data structure");
        return null;
      }

      const returns = calculateReturns(data);

      // Validate returns calculation
      if (!returns || returns.length === 0) {
        console.log("Failed to calculate returns");
        return null;
      }

      const meanRets = meanReturns(returns);
      const covMat = covarianceMatrix(returns);

      // Validate matrix dimensions
      if (meanRets.length !== data.length || covMat.length !== data.length) {
        console.log("Matrix dimension mismatch");
        return null;
      }

      const minWeights = [0,0,0,0,0,0,0];
      const maxWeights = [1,1,1,1,1,1,1];

      const bestPortfolio = geneticOptimization(
        meanRets,
        covMat,
        500,
        100,
        0.1,
        0.06,
        "riskConstrained",
        minWeights,
        maxWeights
      );

      if (!bestPortfolio) {
        console.log("Optimization failed");
        return null;
      }
      // setBest(bestPortfolio);

      const stockName = data
        .map((obj: Stock) => obj.ticker)
        .filter(
          (ticker): ticker is string => ticker !== undefined && ticker !== null
        );

      const result = stockName.map((ticker: string, i: number) => ({
        ticker,
        weight: bestPortfolio.weights[i],
      }));
      console.log("Portfolio calculation result:", result);
      console.log("Best Portfolio:", bestPortfolio);
      setResults(result);
      setPortfolio(bestPortfolio);
      return { result, bestPortfolio };
    } catch (error) {
      console.error("Portfolio calculation error:", error);
      return null;
    }
 
  }
  
  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stocks", {
        next: { revalidate: 3600000 },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const jsonData = await res.json();
      setData(jsonData.stocks);
      await calculate(jsonData.stocks);

     
       
      
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  
  
  return (
    <div>
      <h1>Modern Portfolio Optimizer</h1>
      <button
        onClick={handleFetch}
        disabled={isLoading}
        style={{
          padding: "10px 20px",
          marginBottom: "20px",
          backgroundColor: isLoading ? "#cccccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "Loading..." : "Calculate Portfolio"}
      </button>
      <Link href="/">Go back to the homepage</Link>
      {data && (
        <div>
          <h2>Stock Data:</h2>
          {data?.map((stock, index) => (
            <div key={index}>
              <p>
                <strong>Ticker:</strong> {stock.ticker}
              </p>
              <p>
                <strong>Data Points:</strong>
              </p>
              {stock.data &&
                stock.data.slice(0, 5).map((point: any, idx: number) => (
                  <p key={idx}>
                    Date: {new Date(point.date).toLocaleDateString()} - Close: $
                    {point.close.toFixed(2)} - Change:{" "}
                    {point.changePercent.toFixed(2)}%
                  </p>
                ))}
              <hr />
            </div>
          ))}
        </div>
      )}
      {result && result.length > 0 && (
      <div>
        <h2>Portfolio Weights</h2>
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Stock</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Weight</th>
            </tr>
          </thead>
          <tbody>
            {result.map((item, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.ticker}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {(item.weight * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {bestPortfolio && bestPortfolio.meanReturn !== undefined && (
      <div style={{ marginTop: '20px' }}>
        <h2>Portfolio Statistics</h2>
        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          <p><strong>Expected Return:</strong> {(bestPortfolio.meanReturn * 100).toFixed(2)}%</p>
          <p><strong>Risk (Standard Deviation):</strong> {(bestPortfolio.stdDev * 100).toFixed(2)}%</p>
          <p><strong>Sharpe Ratio:</strong> {bestPortfolio.fitness.toFixed(4)}</p>
        </div>
      </div>
    )}
    </div>
  );
}

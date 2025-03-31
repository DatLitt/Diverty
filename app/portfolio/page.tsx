"use client";
import { useState } from "react";
import { useData } from "../context/DataContext";
import { calculate } from "../utils/calculatePortfolio";
import styles from "./page.module.css";


export default function Portfolio() {
  const { data, result, bestPortfolio, setData, setResults, setPortfolio } = useData();
  const [best, setBest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  
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
      const results = await calculate(jsonData.stocks);
      setResults(results?.result ?? []);
      setPortfolio(results?.bestPortfolio ?? bestPortfolio);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  
  
  return (
    <div className={styles.container}>
      <div className={styles.upperBox}></div>
      <div className={styles.lowerBox}>
        
      </div>

    </div>
  );
}
      {/* <h1>Modern Portfolio Optimizer</h1>
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
    )} */}


"use client";
import { useState } from "react";
import { useData } from "../context/DataContext";
import yahooFinance from "yahoo-finance2"; // ✅ Correct import
import { calculate } from "../utils/calculatePortfolio";
import styles from "./page.module.css";

export default function Portfolio() {
  const { setData, setResults, setPortfolio } = useData();
  const [searchQuery, setSearchQuery] = useState("Apple");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        throw new Error("Search request failed");
      }
      const data = await response.json();
      setSearchResults(data.quotes || []);
      console.log("Search results:", data.quotes);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  };
  const [selectedStocks, setSelectedStocks] = useState<
    Array<{
      symbol: string;
      shortname: string;
      exchange: string;
    }>
  >([]);

  const handleStockSelect = (stock: any) => {
    setSelectedStocks((prev) => {
      const exists = prev.some((s) => s.symbol === stock.symbol);
      if (exists) {
        return prev.filter((s) => s.symbol !== stock.symbol);
      } else {
        return [
          ...prev,
          {
            symbol: stock.symbol,
            shortname: stock.shortname,
            exchange: stock.exchange,
          },
        ];
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.step1Box}>
        <div className={styles.selectBox}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stock..."
            />
            <button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <ul className={styles.stockList}>
            {searchResults
              .filter((stock) => stock.quoteType === "EQUITY")
              .map((stock) => (
                <li
                  key={`${stock.symbol}-${stock.exchange}`}
                  onClick={() => handleStockSelect(stock)}
                  className={`${styles.stockItem} ${
                    selectedStocks.some((s) => s.symbol === stock.symbol)
                      ? styles.selected
                      : ""
                  }`}
                >
                  {stock.shortname} ({stock.symbol})
                </li>
              ))}
          </ul>
        </div>
        <div className={styles.setupBox}>
          <input type="date" />
          <input type="date" />
          <label>Choose a car:</label>

          <select name="cars" id="cars">
            <option value="volvo">Volvo</option>
            <option value="saab">Saab</option>
            <option value="mercedes">Mercedes</option>
            <option value="audi">Audi</option>
          </select>
          <h3>Selected Stocks</h3>
          {selectedStocks.length > 0 ? (
            <ul className={styles.selectedStockList}>
              {selectedStocks.map((stock) => (
                <li key={stock.symbol} className={styles.selectedStockItem}>
                  <span>{stock.shortname}</span>
                  <button
                    onClick={() => handleStockSelect(stock)}
                    className={styles.removeButton}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyMessage}>No stocks selected</p>
          )}
        </div>
      </div>
      <div className={styles.step2Box}></div>
      <div className={styles.resultBox}></div>
    </div>
  );
}

{
  /* <h1>Modern Portfolio Optimizer</h1>
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
    )} */
}

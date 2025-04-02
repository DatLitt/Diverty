"use client";
import { useState } from "react";
import { useData } from "../context/DataContext";
import yahooFinance from "yahoo-finance2"; // ✅ Correct import
import { calculate } from "../utils/calculatePortfolio";
import styles from "./page.module.css";
import { getStockData } from "../lib/getData";

export default function Portfolio() {
  const { data, setData, setResults, setPortfolio } = useData();
  const [searchQuery, setSearchQuery] = useState("Apple");
  const [startDate, setStartDate] = useState("2021-12-15");
  const [endDate, setEndDate] = useState("2024-12-15");
  const [interval, setInterval] = useState("1wk");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<
    Array<{
      symbol: string;
      shortname: string;
      exchange: string;
    }>
  >([]);

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
  const handleStocksData = async (stockSymbols: string[]) => {
    console.log("Selected stocks:", stockSymbols);
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        stockSymbols: stockSymbols.join(","),
        startDate: startDate.toString(),
        endDate: endDate.toString(),
        interval: interval,
      }).toString();
      console.log("Query params:", queryParams.toString());

      const response = await fetch(`/api/stocks?${queryParams}`);
      if (!response.ok) {
        throw new Error("Data request failed");
      }
      const rawData = await response.json();

      const data = rawData.stocks.map((stock: any) => stock.value);

      setData(data);
      console.log("Stock data:", data);
    } catch (err) {
      console.error("Data error:", err);
      setError(err instanceof Error ? err.message : "Data failed");
    } finally {
      setIsLoading(false);
    }
  };

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
              .filter((stock) => stock.isYahooFinance === true)
              .filter((stock) => stock.symbol !== undefined)
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
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <label>Choose Interval:</label>

          <select
            name="interval"
            id="interval"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value="1wk">1 week</option>
            <option value="1mo">1 month</option>
          </select>
          <button
            onClick={async () => {
              handleStocksData(selectedStocks.map((s) => s.symbol));
            }}
          >
            Confirm
          </button>
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
      <div className={styles.step2Box}>
        {data && (
          <div>
            <h2>Stock Data:</h2>
            {data
              ?.filter((s: any) => s === undefined || !s.data?.length)
              .map((stock) => (
                <p>{stock?.ticker}</p>
              ))}
            {data
              ?.filter((s: any) => s !== undefined && s.data?.length)
              .map((stock, index) => (
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
                        Date: {new Date(point.date).toLocaleDateString()} -
                        Close: ${point.close.toFixed(2)} - Change:{" "}
                        {point.changePercent.toFixed(2)}%
                      </p>
                    ))}
                  <hr />
                </div>
              ))}
          </div>
        )}
      </div>
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

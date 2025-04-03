"use client";
import { useState } from "react";
import { useData } from "../context/DataContext";
import styles from "./page.module.css";
import { Stock, StockDetails } from "../types/test";
import { geneticOptimization } from "../utils/optimizer";
import { calculateReturns, covarianceMatrix, meanReturns } from "../utils/mpt";
import dynamic from "next/dynamic";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Delete } from "@mui/icons-material";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Portfolio() {
  const { data, bestPortfolio, result, setData, setResults, setPortfolio } =
    useData();
  const [searchQuery, setSearchQuery] = useState("Apple");
  const [startDate, setStartDate] = useState("2021-12-15");
  const [endDate, setEndDate] = useState("2024-12-15");
  const [interval, setInterval] = useState("1wk");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tempValidData, setTempValidData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [insufficientDataStocks, setInsufficientDataStocks] = useState<
    StockDetails[]
  >([]);
  // Add this near your other state declarations
  const [undefinedStocks, setUndefinedStocks] = useState<StockDetails[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<StockDetails[]>([]);
  console.log(data);
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
    setUndefinedStocks([]);

    try {
      setData([]); // Clear previous data
      const queryParams = new URLSearchParams({
        stockSymbols: stockSymbols.join(","),
        startDate: dayjs(startDate).format("YYYY-MM-DD"),
        endDate: dayjs(endDate).format("YYYY-MM-DD"),
        interval: interval,
      }).toString();

      const response = await fetch(`/api/stocks?${queryParams}`);
      if (!response.ok) {
        throw new Error("Data request failed");
      }
      const rawData = await response.json();

      // Find undefined stocks by comparing with selectedStocks
      const receivedSymbols = rawData.stocks
        .filter(
          (stock: any) =>
            stock?.value?.ticker &&
            stock?.value?.data &&
            stock.value.data.length > 0 // Only consider stocks with actual data
        )
        .map((stock: any) => stock.value.ticker);

      // Find symbols that are in selectedStocks but not in received data
      const undefinedStockDetails: StockDetails[] = selectedStocks
        .filter((stock) => {
          const stockData = rawData.stocks.find(
            (s: any) => s?.value?.ticker === stock.symbol
          );
          return !stockData?.value?.data?.length; // Returns true for undefined, null, or empty array
        })
        .map((stock) => {
          const { symbol, shortname, exchange, quoteType } = stock;
          return { symbol, shortname, exchange, quoteType };
        });

      if (undefinedStockDetails.length > 0) {
        setUndefinedStocks(undefinedStockDetails);
        console.log("Undefined stocks:", undefinedStockDetails);
      }

      const validData = rawData.stocks
        .filter(
          (stock: any) =>
            stock.value !== undefined &&
            stock.value.data &&
            stock.value.data.length > 0
        )
        .map((stock: any) => stock.value);
      setTempValidData(validData);
      console.log(undefinedStocks);
      ////////////////////////////////

      const validStocks = rawData.stocks.filter(
        (stock: any) =>
          stock.value !== undefined &&
          stock.value.data &&
          stock.value.data.length > 0
      );

      // Find the stock with the most data points
      const maxDataPoints = Math.max(
        ...validStocks.map((stock: any) => stock.value.data.length)
      );
      const threshold = maxDataPoints * 0.8; // 80% threshold
      console.log("Max data points:", threshold);
      // Check for stocks with insufficient data
      const insufficientData = validStocks
        .filter((stock: any) => stock.value.data.length < threshold)
        .map((stock: any) => stock.value.ticker);

      // Match with selected stocks for display
      const insufficientStockDetails = selectedStocks
        .filter((stock) => insufficientData.includes(stock.symbol))
        .map((stock) => ({
          symbol: stock.symbol,
          shortname: stock.shortname,
          exchange: stock.exchange,
          quoteType: stock.quoteType,
          dataPoints: validStocks.find(
            (s: any) => s.value.ticker === stock.symbol
          )?.value.data.length,
          maxDataPoints,
        }));

      if (insufficientStockDetails.length > 0) {
        setInsufficientDataStocks(insufficientStockDetails);
        console.log("Stocks with insufficient data:", insufficientStockDetails);
      }
      if (
        undefinedStockDetails.length === 0 &&
        insufficientStockDetails.length === 0
      ) {
        setData(validData);
      }
      console.log("Stock data:", validData);
    } catch (err) {
      console.error("Data error:", err);
      setError(err instanceof Error ? err.message : "Data failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockSelect = (stock: any) => {
    setSelectedStocks((prev) => {
      const exists = prev.some(
        (s) => s.symbol === stock.symbol && s.quoteType === stock.quoteType
      );
      if (exists) {
        return prev.filter(
          (s) => s.symbol !== stock.symbol || s.quoteType !== stock.quoteType
        );
      } else {
        return [
          ...prev,
          {
            symbol: stock.symbol,
            shortname: stock.shortname,
            exchange: stock.exchange,
            quoteType: stock.quoteType,
          },
        ];
      }
    });
  };
  ///////////////////////////////

  function handleCalculate() {
    const returns = calculateReturns(data);
    const meanRets = meanReturns(returns);
    const covMat = covarianceMatrix(returns);

    // Validate matrix dimensions
    if (meanRets.length !== data.length || covMat.length !== data.length) {
      console.log("Matrix dimension mismatch");
      return null;
    }

    const minWeights = [0, 0, 0, 0, 0, 0, 0.1];
    const maxWeights = [1, 1, 0.5, 1, 1, 1, 1];

    const bestPortfolio = geneticOptimization(
      meanRets,
      covMat,
      500,
      100,
      0.1,
      0.05,
      "riskConstrained",
      minWeights,
      maxWeights
    );

    if (!bestPortfolio) {
      console.log("Optimization failed");
      return null;
    }
    setPortfolio(bestPortfolio);
    const stockName = data
      .map((obj: Stock) => obj.ticker)
      .filter(
        (ticker): ticker is string => ticker !== undefined && ticker !== null
      );
    const result = stockName.map((ticker: string, i: number) => ({
      ticker,
      weight: bestPortfolio.weights[i],
    }));
    setResults(result);
    console.log("Portfolio calculation result:", result);
    console.log("Best Portfolio:", bestPortfolio);
  }

  /////////////////////////////////////////////

  // Add this function in your Portfolio component
  const renderTreeMap = () => {
    if (!result || !bestPortfolio || result.length === 0) return null;

    const series = [
      {
        name: "Weight(%)",
        data: result.map((item) => ({
          x: item.ticker,
          y: +(item.weight * 100).toFixed(2),
        })),
      },
    ];

    const options: ApexCharts.ApexOptions = {
      legend: {
        show: false,
      },
      chart: {
        height: 400,
        type: "treemap" as const,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
          export: {
            csv: {
              filename: "portfolio_allocation",
              columnDelimiter: ",",
              headerCategory: `Portfolio Statistics\nExpected Return:,${(
                bestPortfolio.meanReturn * 100
              ).toFixed(2)}%\nRisk (Std Dev):,${(
                bestPortfolio.stdDev * 100
              ).toFixed(2)}%\n\nStock`,
            },
          },
        },
      },
      title: {
        text: "Portfolio Allocation",
        align: "center",
      },
      dataLabels: {
        enabled: true,
        formatter: function (text: string, op: any) {
          return [text, op.value + "%"];
        },
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value.toFixed(2)}%`,
        },
      },
      plotOptions: {
        treemap: {
          colorScale: {
            ranges: [
              {
                from: 0,
                to: 100,
                color: "#00B746",
              },
            ],
          },
        },
      },
    };

    return (
      <Chart options={options} series={series} type="treemap" height={400} />
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
              <button
                className="primaryButton"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <ul className={styles.stockList}>
              {searchResults
                .filter((stock) => stock.isYahooFinance === true)
                .filter((stock) => stock.symbol !== undefined)
                .reduce((unique, stock) => {
                  const existingStock = unique.find(
                    (s: { symbol: string; quoteType: string }) =>
                      s.symbol === stock.symbol
                  );
                  if (!existingStock) {
                    unique.push(stock);
                  } else if (
                    existingStock.quoteType !== "EQUITY" &&
                    stock.quoteType === "EQUITY"
                  ) {
                    // Replace non-EQUITY with EQUITY version if found
                    unique[unique.indexOf(existingStock)] = stock;
                  }
                  return unique;
                }, [] as typeof searchResults)
                .map(
                  (stock: {
                    symbol: string;
                    shortname: string;
                    quoteType: string;
                  }) => (
                    <li
                      key={`${stock.symbol}-${stock.quoteType}`}
                      onClick={() => {
                        handleStockSelect(stock);
                      }}
                      className={`${styles.stockItem} ${
                        selectedStocks.some((s) => s.symbol === stock.symbol)
                          ? styles.selected
                          : ""
                      }`}
                    >
                      {stock.shortname} ({stock.symbol})
                    </li>
                  )
                )}
            </ul>
          </div>
          <div className={styles.setupBox}>
            {insufficientDataStocks.length > 0 && (
              <div className={styles.popup}>
                <div className={styles.popupContent}>
                  <h3>Warning: Incomplete Data</h3>
                  <p>
                    The following stocks have significantly less data points
                    than others:
                  </p>
                  <ul>
                    {insufficientDataStocks.map((stock) => (
                      <li key={stock.symbol}>
                        {stock.shortname} ({stock.symbol})<br />
                        <small>Has {stock.shortname} data points</small>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.warningText}>
                    This might affect the accuracy of your portfolio
                    calculations.
                  </p>
                  <div className={styles.buttonGroup}>
                    <button
                      onClick={() =>
                        insufficientDataStocks.forEach((stock) => {
                          handleStockSelect(stock);
                          setInsufficientDataStocks([]);
                        })
                      }
                    >
                      Remove these stocks
                    </button>
                    <button
                      onClick={() => {
                        setInsufficientDataStocks([]);
                        setData(tempValidData);
                      }}
                    >
                      Keep anyway
                    </button>
                  </div>
                </div>
              </div>
            )}
            {undefinedStocks.length > 0 && (
              <div className={styles.popup}>
                <div className={styles.popupContent}>
                  <h3>Warning: Missing Data</h3>
                  <p>
                    The following stocks have no data for the selected period:
                  </p>
                  <ul>
                    {undefinedStocks.map((stock) => (
                      <li key={stock.symbol}>{stock.shortname} </li>
                    ))}
                  </ul>
                  <button
                    onClick={() =>
                      undefinedStocks.forEach((stock) => {
                        handleStockSelect(stock);
                        setUndefinedStocks([]);
                      })
                    }
                  >
                    Delete all
                  </button>
                  <button onClick={() => setUndefinedStocks([])}>Close</button>
                </div>
              </div>
            )}
            <DatePicker
              label="Start Date"
              value={dayjs(startDate)}
              onChange={(date) =>
                date && setStartDate(date.format("YYYY-MM-DD"))
              }
            />
            <DatePicker
              label="End Date"
              value={dayjs(endDate)}
              onChange={(date) => date && setEndDate(date.format("YYYY-MM-DD"))}
            />
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="demo-simple-select-label">Interval</InputLabel>
              <Select
                value={interval}
                label="Interval"
                onChange={(e) => setInterval(e.target.value)}
              >
                <MenuItem value="1wk">Weekly</MenuItem>
                <MenuItem value="1mo">Monthly</MenuItem>
              </Select>
            </FormControl>

            <button
              onClick={() => {
                setSelectedStocks([]);
              }}
            >
              Delete all
            </button>
            <h3>Selected Stocks</h3>
            {selectedStocks.length > 0 ? (
              <ul className={styles.selectedStockList}>
                {selectedStocks.map((stock) => (
                  <li
                    key={`${stock.symbol}-${stock.quoteType}`}
                    className={styles.selectedStockItem}
                  >
                    <span>{stock.shortname}</span>
                    <button
                      onClick={() => handleStockSelect(stock)}
                      className={styles.removeButton}
                    >
                      <Delete />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyMessage}>No stocks selected</p>
            )}
            <button
              className="primaryButton"
              onClick={async () => {
                handleStocksData(selectedStocks.map((s) => s.symbol));
              }}
            >
              Confirm
            </button>
          </div>
        </div>
        <div className={styles.step2Box}>
          <button onClick={() => handleCalculate()}>Calculate</button>
          <button>Heatmap</button>
        </div>
        <div className={styles.resultBox}>
          {" "}
          {result && result.length > 0 && (
            <div className={styles.treeMapContainer}>{renderTreeMap()}</div>
          )}
        </div>
      </div>
    </LocalizationProvider>
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

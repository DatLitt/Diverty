"use client";
import { useEffect, useState } from "react";
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
  // Add near other state declarations at the top of the component
  // Add near other state declarations at the top
  const [optimizationType, setOptimizationType] = useState<
    "riskConstrained" | "minRisk" | "returnConstrained" | "noRiskLimit"
  >("riskConstrained");
  const [dateError, setDateError] = useState<string | null>(null);
  const [tempInputValues, setTempInputValues] = useState<{
    [key: string]: string;
  }>({});
  const [constraintValue, setConstraintValue] = useState(0.1);
  const [minWeights, setMinWeights] = useState<number[]>([]);
  const [maxWeights, setMaxWeights] = useState<number[]>([]);
  const [test123, setTest123] = useState(0);
  const { data, bestPortfolio, result, setData, setResults, setPortfolio } =
    useData();
  const [searchQuery, setSearchQuery] = useState("Apple");
  const [startDate, setStartDate] = useState(
    dayjs().subtract(5, "year").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [weightError, setWeightError] = useState<string | null>(null);
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

  // Add these validation functions before the return statement
  const validateAndSetStartDate = (newDate: dayjs.Dayjs | null) => {
    if (!newDate) return;

    const formattedDate = newDate.format("YYYY-MM-DD");
    const endDateObj = dayjs(endDate);

    if (newDate.isAfter(endDateObj)) {
      setDateError("Start date cannot be after end date");
      setStartDate(endDate); // Reset to end date
      return;
    }

    setDateError(null);
    setStartDate(formattedDate);
  };

  const validateAndSetEndDate = (newDate: dayjs.Dayjs | null) => {
    if (!newDate) return;

    const today = dayjs();
    const startDateObj = dayjs(startDate);

    if (newDate.isAfter(today)) {
      setDateError("End date cannot be in the future");
      setEndDate(today.format("YYYY-MM-DD")); // Reset to today
      return;
    }

    if (newDate.isBefore(startDateObj)) {
      setDateError("End date cannot be before start date");
      setEndDate(startDate); // Reset to start date
      return;
    }

    setDateError(null);
    setEndDate(newDate.format("YYYY-MM-DD"));
  };

  const validateAndSetWeights = (
    newValue: number,
    index: number,
    type: "min" | "max"
  ) => {
    let value = newValue;
    let message = null;

    // Ensure value is between 0 and 100
    if (value < 0) {
      value = 0;
      message = "Weight cannot be negative";
    } else if (value > 100) {
      value = 100;
      message = "Weight cannot exceed 100%";
    }

    // Convert percentage to decimal for internal storage
    let decimalValue = value / 100;

    if (type === "min") {
      const newMinWeights = [...minWeights];
      const otherMinWeightsSum = newMinWeights.reduce(
        (sum, w, i) => sum + (i === index ? 0 : w || 0),
        0
      );

      // Calculate maximum possible value for this minimum weight
      const maxPossibleMin = 1 - otherMinWeightsSum;

      // Check if min weight would exceed max weight
      if (decimalValue > maxWeights[index]) {
        value = Math.floor(maxWeights[index] * 100);
        message = "Minimum weight cannot exceed maximum weight";
        newMinWeights[index] = maxWeights[index];
        decimalValue = maxWeights[index];
      }

      if (decimalValue > maxPossibleMin) {
        value = Math.floor(maxPossibleMin * 100);
        message = `Total minimum weight must not exceed 100%`;
        newMinWeights[index] = maxPossibleMin;
      } else {
        newMinWeights[index] = decimalValue;
      }

      setMinWeights(newMinWeights);
    } else {
      const newMaxWeights = [...maxWeights];
      const otherMaxWeightsSum = newMaxWeights.reduce(
        (sum, w, i) => sum + (i === index ? 0 : w || 0),
        0
      );
      const minPossibleMax = 1 - otherMaxWeightsSum;

      // Check if max weight would be less than min weight
      if (decimalValue < minWeights[index]) {
        value = Math.ceil(minWeights[index] * 100);
        message = "Maximum weight cannot be less than minimum weight";
        newMaxWeights[index] = minWeights[index];
        decimalValue = minWeights[index];
      }

      if (decimalValue < minPossibleMax) {
        value = Math.floor(minPossibleMax * 100);
        message = `Total max weight must not below 100%`;
        newMaxWeights[index] = minPossibleMax;
      } else {
        newMaxWeights[index] = decimalValue;
      }

      setMaxWeights(newMaxWeights);
    }

    setWeightError(message);
    if (message) {
      setTimeout(() => setWeightError(null), 3000);
    }

    return Math.round(value);
  };

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
        // Initialize weight arrays with default values when new data is loaded
        setMinWeights(new Array(validData.length).fill(0));
        setMaxWeights(new Array(validData.length).fill(1));
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

    const minWeightsToUse =
      minWeights.length === data.length
        ? minWeights.map((w) => (w === null || w === undefined ? 0 : w))
        : new Array(data.length).fill(0);

    const maxWeightsToUse =
      maxWeights.length === data.length
        ? maxWeights.map((w) => (w === null || w === undefined ? 1 : w))
        : new Array(data.length).fill(1);

    console.log("minWeightsToUse:", minWeightsToUse);
    console.log("maxWeightsToUse:", maxWeightsToUse);
    console.log("constraintValue:", constraintValue);

    const bestPortfolio = geneticOptimization(
      meanRets,
      covMat,
      500,
      100,
      0.1,
      constraintValue, // Using the input constraint value
      optimizationType, // Using selected optimization type
      minWeightsToUse,
      maxWeightsToUse
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
    const div = document.getElementById("myDiv") || undefined;
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
        show: true,
      },
      chart: {
        type: "treemap" as const,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
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
      <Chart
        options={options}
        series={series}
        type="treemap"
        width={div?.offsetWidth}
      />
    );
  };

  const handleResize = () => {
    setTest123(test123 + 1); // Call the function to recalculate on resize
    console.log("Resized", test123);
  };

  useEffect(() => {
    // Check if window is defined (we're in the browser)
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);

      // Cleanup function to remove event listener
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [test123]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={styles.container}>
        <div className={styles.step1Box} id="myDiv">
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
            <div className={styles.setupHeader}>
              <div className={styles.setupTitle}>
                <DatePicker
                  label="Start Date"
                  value={dayjs(startDate)}
                  onChange={(date) => validateAndSetStartDate(date)}
                  maxDate={dayjs(endDate)}
                />
                <DatePicker
                  label="End Date"
                  value={dayjs(endDate)}
                  onChange={(date) => validateAndSetEndDate(date)}
                  maxDate={dayjs()}
                  minDate={dayjs(startDate)}
                />
                {dateError && (
                  <div
                    style={{
                      color: "red",
                      fontSize: "0.8rem",
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      backgroundColor: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      zIndex: 1,
                    }}
                  >
                    {dateError}
                  </div>
                )}

                <FormControl
                  sx={{ minWidth: 120, minHeight: "max-content" }}
                  size="small"
                >
                  <InputLabel id="demo-simple-select-label">
                    Interval
                  </InputLabel>
                  <Select
                    value={interval}
                    label="Interval"
                    onChange={(e) => setInterval(e.target.value)}
                  >
                    <MenuItem value="1wk">Weekly</MenuItem>
                    <MenuItem value="1mo">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <button
                className="dangerButton"
                onClick={() => {
                  setSelectedStocks([]);
                }}
              >
                Delete all
              </button>
            </div>
            <div className={styles.selectedStocks}>
              <h3>Selected Stocks</h3>
              {selectedStocks.length > 0 ? (
                <ul className={styles.stockList}>
                  {selectedStocks.map((stock) => (
                    <li
                      key={`${stock.symbol}-${stock.quoteType}`}
                      className={styles.stockItem}
                    >
                      <span>{stock.shortname}</span>
                      <button
                        onClick={() => handleStockSelect(stock)}
                        className="dangerButton"
                      >
                        <Delete />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyMessage}>No stocks selected</p>
              )}
            </div>
            <button
              className="primaryButton"
              onClick={async () => {
                handleStocksData(selectedStocks.map((s) => s.symbol));
                setPortfolio({
                  meanReturn: 0,
                  stdDev: 0,
                  weights: [],
                  fitness: 0,
                }); // Reset portfolio when fetching new data

                setResults([]); // Reset results when fetching new data
              }}
            >
              Confirm
            </button>
          </div>
        </div>

        {data && data.length > 0 && (
          <div className={styles.step2Box}>
            <div className={styles.step2Header}>
              <FormControl
                sx={{ minWidth: 120, minHeight: "max-content" }}
                size="small"
              >
                <InputLabel>Optimization Type</InputLabel>
                <Select
                  value={optimizationType}
                  label="Optimization Type"
                  onChange={(e) =>
                    setOptimizationType(
                      e.target.value as
                        | "riskConstrained"
                        | "minRisk"
                        | "returnConstrained"
                        | "noRiskLimit"
                    )
                  }
                >
                  <MenuItem value="riskConstrained">Risk Allowed</MenuItem>
                  <MenuItem value="returnConstrained">Desired Interst</MenuItem>
                  <MenuItem value="minRisk">Minimum Risk</MenuItem>
                  <MenuItem value="noRiskLimit">Unlimited Risk</MenuItem>
                </Select>
              </FormControl>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={constraintValue}
                onChange={(e) => setConstraintValue(Number(e.target.value))}
                placeholder={
                  optimizationType === "riskConstrained"
                    ? "Max Risk"
                    : "Min Return"
                }
              />
            </div>
            <ul className={styles.stockList}>
              {weightError && (
                <div
                  style={{
                    color: "red",
                    fontSize: "0.8rem",
                    padding: "8px",
                    marginBottom: "8px",
                    backgroundColor: "#fff",
                    borderRadius: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {weightError}
                </div>
              )}
              {data.map(
                (stock: Stock, index: number) =>
                  stock.ticker && (
                    <li key={stock.ticker} className={styles.stockItem}>
                      {stock.shortName} ({stock.ticker})
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="Min Weight (%)"
                          value={
                            tempInputValues[`min-${index}`] !== undefined
                              ? tempInputValues[`min-${index}`]
                              : Math.round((minWeights[index] || 0) * 100)
                          }
                          onChange={(e) => {
                            setTempInputValues((prev) => ({
                              ...prev,
                              [`min-${index}`]: e.target.value,
                            }));
                          }}
                          onBlur={(e) => {
                            const adjustedValue = validateAndSetWeights(
                              Number(e.target.value),
                              index,
                              "min"
                            );
                            setTempInputValues((prev) => ({
                              ...prev,
                              [`min-${index}`]: adjustedValue.toString(),
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="Max Weight (%)"
                          value={
                            tempInputValues[`max-${index}`] !== undefined
                              ? tempInputValues[`max-${index}`]
                              : Math.round((maxWeights[index] || 1) * 100)
                          }
                          onChange={(e) => {
                            setTempInputValues((prev) => ({
                              ...prev,
                              [`max-${index}`]: e.target.value,
                            }));
                          }}
                          onBlur={(e) => {
                            const adjustedValue = validateAndSetWeights(
                              Number(e.target.value),
                              index,
                              "max"
                            );
                            setTempInputValues((prev) => ({
                              ...prev,
                              [`max-${index}`]: adjustedValue.toString(),
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                        />
                      </div>
                    </li>
                  )
              )}
            </ul>
            <button className="primaryButton" onClick={() => handleCalculate()}>
              Calculate
            </button>
          </div>
        )}
        {bestPortfolio?.weights?.length > 0 && (
          <div className={styles.resultBox}>
            <p className={styles.test123}>{test123}</p>
            {result && result.length > 0 && (
              <div>
                <div style={{ fontSize: "2rem" }}>
                  <p>
                    Interst Rate: {(bestPortfolio.meanReturn * 100).toFixed(2)}%
                  </p>
                  <p>Risk: {(bestPortfolio.stdDev * 100).toFixed(2)}%</p>
                </div>
                <div className={styles.treeMapContainer}>{renderTreeMap()}</div>
              </div>
            )}
          </div>
        )}
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

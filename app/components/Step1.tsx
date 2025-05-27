"use client";
import { Clear, Delete, Search } from "@mui/icons-material";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Spinner } from "../components/Spinner";
import styles from "../portfolio/page.module.css";
import { useEffect, useRef, useState } from "react";
import { StockDetails } from "../types/test";
import { useData } from "../context/DataContext";
import { calculateCorrelation, calculateReturns } from "../utils/mpt";

export default function Step1({
  setValue,
  setMaxWeights,
  setMinWeights,
  selectedStocks,
  setSelectedStocks,
}: {
  setValue: (value: string) => void;
  setMinWeights: (weights: number[]) => void;
  setMaxWeights: (weights: number[]) => void;
  selectedStocks: StockDetails[];
  setSelectedStocks: (
    stocks: StockDetails[] | ((prev: StockDetails[]) => StockDetails[])
  ) => void;
}) {
  const [startDate, setStartDate] = useState(
    dayjs().subtract(5, "year").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dateError, setDateError] = useState<string | null>(null);
  const [interval, setInterval] = useState("1wk");
  const [searchQuery, setSearchQuery] = useState("Apple");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [insufficientDataStocks, setInsufficientDataStocks] = useState<
    StockDetails[]
  >([]);
  const [undefinedStocks, setUndefinedStocks] = useState<StockDetails[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [tempValidData, setTempValidData] = useState<any[]>([]);

  const { setData, setResults, setPortfolio, setFrontier } = useData();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStocksData = async (stockSymbols: string[]) => {
    console.log(selectedStocks);
    setIsFetching(true);
    setError(null);
    setUndefinedStocks([]);

    try {
      setData([]); // Clear previous data
      setFrontier([]); // Clear frontier data
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
        setData((prev) =>
          prev.map((item, index) => ({
            ...item,
            shortName: selectedStocks[index]?.shortname,
          }))
        );
        // Initialize weight arrays with default values when new data is loaded
        setMinWeights(new Array(validData.length).fill(0));
        setMaxWeights(new Array(validData.length).fill(1));
        setValue("2"); // Go to step 2
      }
    } catch (err) {
      console.error("Data error:", err);
      setError(err instanceof Error ? err.message : "Data failed");
    } finally {
      setIsFetching(false);
    }
  };

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

  const handleSearch = async () => {
    setIsSearching(true);
    if (!searchQuery.trim()) return;

    setSearchResults([]); // Clear previous results
    setTimeout(() => {
      setIsSearching(false);
      setShowDropdown(true);
    }, 500);
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
      setIsSearching(false);
    }
  };

  const handleStockSelect = async (stock: any) => {
    let data: {
      price?: number | null;
      changePercent?: number | null;
      sector?: string | null;
      industry?: string | null;
      website?: string | null;
    } | null = null;

    try {
      if (
        !selectedStocks.some(
          (s) => s.symbol === stock.symbol && s.quoteType === stock.quoteType
        )
      ) {
        console.log("fetched");
        const response = await fetch(
          `/api/selectStock?symbol=${encodeURIComponent(stock.symbol)}`
        );
        if (response.ok) {
          data = await response.json();
          console.log("Search results:", data);
        } else {
          console.warn("Search request failed with status:", response.status);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);

      setSelectedStocks((prev) => {
        const exists = prev.some(
          (s) => s.symbol === stock.symbol && s.quoteType === stock.quoteType
        );

        if (exists) {
          return prev.filter(
            (s) => s.symbol !== stock.symbol || s.quoteType !== stock.quoteType
          );
        }
        return [
          ...prev,
          {
            symbol: stock.symbol,
            shortname: stock.shortname,
            exchange: stock.exchange,
            quoteType: stock.quoteType,
            price: data?.price ?? undefined,
            changePercent: data?.changePercent ?? undefined,
            sector: data?.sector ?? undefined,
            industry: data?.industry ?? undefined,
            website: data?.website ?? undefined,
          },
        ];
      });
    }
  };

  return (
    <div className={styles.step1Box}>
      <div className={styles.setupBox}>
        <div className={styles.setupHeader}>
          <div className={styles.setupTitle}>
            <DatePicker
              sx={{
                width: {
                  xs: "33%", // phones
                  // sm: "50%", // tablets
                  md: "27%", // desktops
                },
              }}
              label="Start Date"
              value={dayjs(startDate)}
              onChange={(date) => validateAndSetStartDate(date)}
              maxDate={dayjs(endDate)}
              slotProps={{
                textField: {
                  InputProps: {
                    sx: {
                      height: 40, // set desired height here
                    },
                  },
                },
              }}
            />
            <DatePicker
              sx={{
                width: {
                  xs: "33%", // phones
                  // sm: "50%", // tablets
                  md: "27%", // desktops
                },
              }}
              label="End Date"
              value={dayjs(endDate)}
              onChange={(date) => validateAndSetEndDate(date)}
              maxDate={dayjs()}
              minDate={dayjs(startDate)}
              slotProps={{
                textField: {
                  InputProps: {
                    sx: {
                      height: 40, // set desired height here
                    },
                  },
                },
              }}
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
              sx={{
                width: {
                  xs: "33%", // phones
                  sm: "30%", // tablets
                  md: "20%", // desktops
                },
              }}
              size="small"
            >
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
          </div>
          <div className={styles.searchWrapper} ref={wrapperRef}>
            <input
              type="text"
              value={searchQuery}
              ref={inputRef}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                if (value.length >= 3) {
                  handleSearch();
                }
                if (value.length < 3) {
                  setShowDropdown(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search stock..."
            />

            <button
              className={styles.searchButton}
              onClick={handleSearch}
              disabled={isSearching}
            >
              <Search />
            </button>
            {showDropdown && searchResults.length > 0 && (
              <ul className={[styles.stockList, styles.dropdown].join(" ")}>
                {isSearching && <Spinner />}
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
            )}
          </div>
        </div>
        {insufficientDataStocks.length > 0 && (
          <div className={styles.popup}>
            <div className={styles.popupContent}>
              <h3>Warning: Incomplete Data</h3>
              <p>
                The following stocks have significantly less data points than
                others:
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
                This might affect the accuracy of your portfolio calculations.
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
                    setValue("2"); // Go to step 2
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
              <p>The following stocks have no data for the selected period:</p>
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
        <div className={styles.selectedStocks}>
          {/* <div className={styles.selectedStocksHeader}>
            <h3>Selected Stocks</h3>
            <button
              className="dangerButton"
              onClick={() => {
                setSelectedStocks([]);
              }}
            >
              <Delete />
            </button>
          </div> */}

          {selectedStocks.length > 0 ? (
            <table className={styles.stockTable}>
              <thead>
                <tr>
                  <th>Selected Stocks</th>
                  <th>Price</th>
                  <th>Change Rate</th>
                  <th>Asset</th>
                  <th>
                    <button
                      className="dangerButton"
                      onClick={() => {
                        setSelectedStocks([]);
                      }}
                    >
                      Clear
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedStocks.map((stock) => (
                  <tr key={`${stock.symbol}-${stock.quoteType}`}>
                    <td>{stock.shortname}</td>
                    <td>{stock.price !== undefined ? stock.price : "N/A"}</td>
                    <td>
                      {stock.changePercent !== undefined
                        ? stock.changePercent
                        : "N/A"}
                    </td>
                    <td>{stock.sector || "N/A"}</td>
                    <td>
                      <button
                        onClick={() => handleStockSelect(stock)}
                        className="deleteButton"
                      >
                        <Clear />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.emptyMessage}>No stocks selected</p>
          )}
        </div>

        <button
          disabled={isFetching || selectedStocks.length === 0}
          className="primaryButton"
          onClick={async () => {
            await handleStocksData(selectedStocks.map((s) => s.symbol));
            setPortfolio({
              meanReturn: 0,
              stdDev: 0,
              weights: [],
              fitness: 0,
            });
            setResults([]);
          }}
        >
          {isFetching ? "Fetching..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}

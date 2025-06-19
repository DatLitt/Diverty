"use client";
import { Edit } from "@mui/icons-material";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Portfolio, Stock } from "../types/test";
import styles from "../portfolio/page.module.css";
import React, { use, useEffect, useRef, useState } from "react";
import { useData } from "../context/DataContext";
import {
  calculateReturns,
  meanReturns,
  covarianceMatrix,
  calculateCorrelation,
} from "../utils/mpt";
import dynamic from "next/dynamic";
import { min, re } from "mathjs";
import { frontierService } from "../lib/frontierService";

export default function Step2({
  setMaxWeights,
  setMinWeights,
  setValue,
  minWeights,
  maxWeights,
  optimizationType,
  setOptimizationType,
  constraintValue,
  setConstraintValue,
  expandedIndices,
  setExpandedIndices,
}: {
  expandedIndices: Set<number>;
  setExpandedIndices: React.Dispatch<React.SetStateAction<Set<number>>>;
  constraintValue: number;
  setConstraintValue: (value: number) => void;
  optimizationType:
    | "riskConstrained"
    | "minRisk"
    | "returnConstrained"
    | "noRiskLimit";
  setOptimizationType: (
    type: "riskConstrained" | "minRisk" | "returnConstrained" | "noRiskLimit"
  ) => void;
  setMinWeights: (weights: number[]) => void;
  setMaxWeights: (weights: number[]) => void;
  setValue: (value: string) => void;
  minWeights: number[];
  maxWeights: number[];
}) {
  const [test123, setTest123] = useState(0);
  const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
  const [isCalculating, setIsCalculating] = useState(false);

  const [weightError, setWeightError] = useState<string | null>(null);

  const [tempInputValues, setTempInputValues] = useState<{
    [key: string]: string;
  }>({});
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFrontier, setShowFrontier] = useState(false);
  const [isFrontierLoading, setIsFrontierLoading] = useState(true);

  const { data, frontier, setResults, setFrontier, setPortfolio } = useData();

  const returns = calculateReturns(data);
  const meanRets = meanReturns(returns);
  const covMat = covarianceMatrix(returns);
  const labels = data.map((stock) => stock.ticker);
  const correlationMatrix = calculateCorrelation(returns);
  const frontierPoints = 100;

  useEffect(() => {
    frontierService.resumeUpdateState();
    return () => {
      frontierService.stopUpdateState();
    };
  }, []);

  useEffect(() => {
    console.log("Step2 useEffect triggered", frontier);
    const initializeFrontier = async () => {
      if (frontier.length === 0) {
        frontierService.fetchFrontierSequentially(
          frontierPoints,
          meanRets,
          covMat,
          setFrontier
        );
      }
    };

    initializeFrontier();
  }, []);

  useEffect(() => {
    console.log("Frontier updated:", frontier);
    if (frontier.length === frontierPoints) {
      setIsFrontierLoading(false);
      console.log("Frontier is fully loaded:", frontier);
    }
  }, [frontier]);

  const toggleIndex = (index: number) => {
    setExpandedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index); // Collapse if already open
      } else {
        newSet.add(index); // Expand
      }
      return newSet;
    });
  };
  // Add these validation functions before the return statement

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
      //const maxPossibleMin = 1 - otherMinWeightsSum;
      console.log(Math.round((1 - otherMinWeightsSum) * 100));
      const maxPossibleMin = Math.round((1 - otherMinWeightsSum) * 100) / 100;

      console.log("maxPossibleMin", maxPossibleMin);
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
      const minPossibleMax = Math.round((1 - otherMaxWeightsSum) * 100) / 100;
      console.log("minPossibleMax", minPossibleMax);
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

  const handleHeatmap = () => {
    console.log("handleHeatmap");

    console.log(labels);
    const series = correlationMatrix.map((row, rowIndex) => ({
      name: labels[rowIndex],
      data: row.map((value, colIndex) => ({
        x: labels[colIndex],
        y: parseFloat(value.toFixed(4)), // optional: limit decimals
      })),
    }));
    const div = document.getElementById("myDiv") || undefined;
    const options = {
      chart: {
        type: "heatmap",
        height: 350,
      },
      dataLabels: {
        enabled: false,
      },
      title: {
        text: "Stock Correlation Matrix",
      },
      xaxis: {
        type: "category",
      },
      colors: ["#008FFB"],
      colorScale: {
        ranges: [
          { from: 0, to: 0.3, color: "#FF4560", name: "Low" },
          { from: 0.3, to: 0.7, color: "#FEB019", name: "Medium" },
          { from: 0.7, to: 1, color: "#00E396", name: "High" },
        ],
      },
    } as ApexCharts.ApexOptions;
    return (
      <Chart
        options={options}
        series={series}
        type="heatmap"
        width={div?.offsetWidth! - 40}
        height={"100%"}
      />
    );
  };
  // const fetchFrontier = async (numPoints: number) => {
  //   setIsFrontierLoading(true);

  //   try {
  //     const minReturnResponse = await fetch("/api/calculate", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         meanRets,
  //         covMat,
  //         optimizationType: "minRisk",
  //         constraintValue: constraintValue / 100,
  //         minWeights: [],
  //         maxWeights: [],
  //       }),
  //     });
  //     const maxReturnResponse = await fetch("/api/calculate", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         meanRets,
  //         covMat,
  //         optimizationType: "noRiskLimit",
  //         constraintValue: constraintValue / 100,
  //         minWeights: [],
  //         maxWeights: [],
  //       }),
  //     });

  //     const minReturn = (await minReturnResponse.json()).meanReturn;
  //     const maxReturn = (await maxReturnResponse.json()).meanReturn;

  //     for (let i = 0; i < numPoints; i++) {
  //       // If the pause flag is active, wait before starting next fetch.
  //       while (pauseRef.current) {
  //         await sleep(100); // Wait 100ms before checking again.
  //       }

  //       const targetReturn =
  //         minReturn + (i / (numPoints - 1)) * (maxReturn - minReturn);
  //       try {
  //         const response = await fetch("/api/calculate", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({
  //             meanRets,
  //             covMat,
  //             optimizationType: "returnConstrained",
  //             constraintValue: targetReturn,
  //             minWeights: [],
  //             maxWeights: [],
  //           }),
  //         });
  //         const point = await response.json();
  //         setFrontier((prevFrontier) =>
  //           [...prevFrontier, point].sort((a, b) => a.stdDev - b.stdDev)
  //         );
  //       } catch (error) {
  //         console.error(
  //           `Error fetching point ${i} for targetReturn ${targetReturn}`,
  //           error
  //         );
  //         // Optionally, you could skip or retry here.
  //       }
  //     }
  //     return;
  //   } catch (error) {
  //     console.error("Error fetching frontier:", error);
  //     return [];
  //   } finally {
  //     setIsFrontierLoading(false);
  //   }
  // };

  const handleFrontier = () => {
    // if (frontier.length === 0) {
    //   fetchFrontier(5).then((response) => {
    //     if (response) {
    //       setFrontier(response);
    //       console.log("Frontier handled:", frontier);
    //     } else {
    //       console.error("Failed to fetch frontier");
    //     }
    //   });
    // }
    const frontierData = frontier.map((p) => ({
      x: p.stdDev * 100,
      y: p.meanReturn * 100,
    }));
    const series = [
      {
        name: "Efficient Frontier",
        data: frontierData,
      },
    ];
    console.log("Efficient Frontier Data:", series);

    const chartOptions: ApexCharts.ApexOptions = {
      chart: {
        type: "line",
        zoom: {
          enabled: true,
          type: "xy",
        },
        animations: {
          enabled: false,
        },
        events: {
          dataPointSelection: function (event, chartContext, config) {
            const { seriesIndex, dataPointIndex } = config;
            const x = config.w.globals.seriesX[seriesIndex][dataPointIndex];
            const y = config.w.globals.series[seriesIndex][dataPointIndex];

            alert(
              `Clicked Point:\nRisk: ${x.toFixed(2)}%\nReturn: ${y.toFixed(2)}%`
            );
          },
        },
      },
      xaxis: {
        title: {
          text: "Portfolio Risk (Standard Deviation %)",
          style: {
            fontSize: "14px",
            fontWeight: 600,
          },
        },
        tickAmount: 10,
        decimalsInFloat: 2,
        labels: {
          formatter: (value: string) => `${parseFloat(value)?.toFixed(2)}%`,
        },
      },
      yaxis: {
        title: {
          text: "Expected Return (%)",
          style: {
            fontSize: "14px",
            fontWeight: 600,
          },
        },
        tickAmount: 10,
        decimalsInFloat: 2,
        labels: {
          formatter: (val: number) => `${val?.toFixed(2)}%`,
        },
      },
      tooltip: {
        shared: false,
        intersect: true,
        custom: function ({ seriesIndex, dataPointIndex, w }: any) {
          const result = labels
            .filter((ticker): ticker is string => ticker !== undefined)
            .map((ticker, i) => ({
              ticker,
              weight: Number(frontier[dataPointIndex].weights[i]),
            }));
          const y = w.globals.series[seriesIndex][dataPointIndex];
          const x = w.globals.seriesX[seriesIndex][dataPointIndex];
          return `
      <div class="custom-tooltip">
        <span>Risk: ${x.toFixed(2)}%</span><br/>
        <span>Return: ${y.toFixed(2)}%</span>
        <div style="margin-top: 10px;">
          <strong>Weights:</strong>
          <ul>
            ${result
              .map(
                (item) =>
                  `<li>${item.ticker}: ${(item.weight * 100).toFixed(2)}%</li>`
              )
              .join("")}
          </ul> 
        
      </div>
    `;
        },
      },
      markers: {
        size: 4,
        strokeWidth: 0,
      },
      grid: {
        borderColor: "#f1f1f1",
      },
      theme: {
        mode: "light",
      },
    };

    const div = document.getElementById("myDiv");
    const width = div ? div.offsetWidth - 40 : 800;

    return (
      <Chart
        options={chartOptions}
        series={series}
        type="line"
        width={div?.offsetWidth! - 40}
        height={"100%"}
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

  ///////////////////////////////

  const handleCalculate = async () => {
    setIsCalculating(true); // Set isCalculating to true at the start of calculation
    frontierService.pauseFetching(); // Pause any ongoing frontier fetching
    setPortfolio({
      meanReturn: 0,
      stdDev: 0,
      weights: [],
      fitness: 0,
    });
    setResults([]);
    console.log(isCalculating);
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      if (meanRets.length !== data.length || covMat.length !== data.length) {
        console.log("Matrix dimension mismatch");
        return;
      }

      const minWeightsToUse =
        minWeights.length === data.length
          ? minWeights.map((w) => (w == null ? 0 : w))
          : new Array(data.length).fill(0);

      const maxWeightsToUse =
        maxWeights.length === data.length
          ? maxWeights.map((w) => (w == null ? 1 : w))
          : new Array(data.length).fill(1);

      console.log("minWeightsToUse:", minWeightsToUse);
      console.log("maxWeightsToUse:", maxWeightsToUse);
      console.log("constraintValue:", constraintValue);

      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meanRets,
          covMat,
          populationSize: 500, // You can adjust this value
          generations: 100, // You can adjust this value
          optimizationType,
          constraintValue: constraintValue / 100,
          minWeights: minWeightsToUse,
          maxWeights: maxWeightsToUse,
          isFrontier: false, // Set to false for regular optimization
        }),
      });

      if (!response.ok) {
        throw new Error("Optimization failed");
      }

      const bestPortfolio = await response.json();

      if (!bestPortfolio) {
        console.log("Optimization failed");
        return;
      }

      setPortfolio(bestPortfolio);

      const result = labels
        .filter((ticker): ticker is string => ticker !== undefined)
        .map((ticker, i) => ({
          ticker,
          weight: Number(bestPortfolio.weights[i]),
        }));

      setResults(result);
      if (bestPortfolio?.fitness > 0) {
        setValue("3"); // Go to step 3
      }
      console.log("Portfolio calculation result:", result);
      console.log("Best Portfolio:", bestPortfolio);
      /////////////////////test frontier

      /////////////////////////////////////////
    } catch (error) {
      console.error("Error in handleCalculate:", error);
    } finally {
      frontierService.resumeFetching(); // Resume fetching frontier after calculation
      setIsCalculating(false); // ✅ Always runs
    }
  };

  return (
    <div className={styles.step2Box}>
      {!showHeatmap && !showFrontier && (
        <div className={styles.setupBox}>
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
                <MenuItem value="riskConstrained">
                  Maximum Risk Allowed
                </MenuItem>
                <MenuItem value="returnConstrained">
                  Minimum Return Rate
                </MenuItem>
                <MenuItem value="minRisk">Minimum Risk</MenuItem>
                <MenuItem value="noRiskLimit">Maximum Return Rate</MenuItem>
              </Select>
            </FormControl>

            {optimizationType !== "minRisk" &&
              optimizationType !== "noRiskLimit" && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    className={styles.numberInput100}
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={constraintValue}
                    onChange={(e) => setConstraintValue(Number(e.target.value))}
                    placeholder={
                      optimizationType === "riskConstrained"
                        ? "Max Risk"
                        : "Min Return"
                    }
                  />
                  <span>%</span>
                </div>
              )}
            <button
              className="primaryButton"
              onClick={() => {
                setShowHeatmap(true);
                frontierService.stopUpdateState();
                // handleHeatmap();
              }}
            >
              Heatmap
            </button>
            <button
              className="primaryButton"
              onClick={() => {
                setShowFrontier(true);
              }}
              disabled={isFrontierLoading}
            >
              {isFrontierLoading
                ? `Efficient Frontier (${Math.floor(
                    (frontier.length / frontierPoints) * 100
                  )}%)`
                : "Efficient Frontier"}
            </button>
          </div>
          <div className={styles.selectedStocks}>
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
                      <div style={{ width: "fit-content", display: "flex" }}>
                        {expandedIndices.has(index) && (
                          <>
                            <label>Min:</label>
                            <div style={{ position: "relative" }}>
                              <input
                                className={styles.numberInput}
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
                              <span>%</span>
                            </div>
                            <label>Max:</label>
                            <div style={{ position: "relative" }}>
                              <input
                                className={styles.numberInput}
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
                              <span>%</span>
                            </div>
                          </>
                        )}

                        <button
                          className="editButton"
                          type="button"
                          onClick={() => toggleIndex(index)}
                        >
                          <Edit />
                        </button>
                      </div>
                    </li>
                  )
              )}
            </ul>
          </div>
          <button
            className="primaryButton"
            onClick={() => {
              handleCalculate();
            }}
            disabled={isCalculating}
          >
            {isCalculating ? "Calculating..." : "Calculate"}
          </button>
        </div>
      )}
      {showHeatmap && (
        <div className={styles.setupBox}>
          <div className={styles.step2Header}>
            <button
              className="primaryButton"
              onClick={() => {
                setShowHeatmap(false);
                frontierService.resumeUpdateState();
              }}
            >
              Back
            </button>
          </div>
          <div className={styles.treeMapContainer}>{handleHeatmap()}</div>
        </div>
      )}
      {showFrontier && (
        <div className={styles.setupBox}>
          <div className={styles.step2Header}>
            <button
              className="primaryButton"
              onClick={() => setShowFrontier(false)}
            >
              Back
            </button>
          </div>
          <div className={styles.treeMapContainer}>{handleFrontier()}</div>
        </div>
      )}
    </div>
  );
}

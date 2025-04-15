"use client";
import { Edit } from "@mui/icons-material";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Stock } from "../types/test";
import styles from "../portfolio/page.module.css";
import { useState } from "react";
import { useData } from "../context/DataContext";
import { calculateReturns, meanReturns, covarianceMatrix } from "../utils/mpt";
import { geneticOptimization } from "../utils/optimizer";

export default function Step2({
  setMaxWeights,
  setMinWeights,
  setValue,
  minWeights,
  maxWeights,
}: {
  setMinWeights: (weights: number[]) => void;
  setMaxWeights: (weights: number[]) => void;
  setValue: (value: string) => void;
  minWeights: number[];
  maxWeights: number[];
}) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [optimizationType, setOptimizationType] = useState<
    "riskConstrained" | "minRisk" | "returnConstrained" | "noRiskLimit"
  >("riskConstrained");
  const [constraintValue, setConstraintValue] = useState(0.05);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    new Set()
  );
  const [tempInputValues, setTempInputValues] = useState<{
    [key: string]: string;
  }>({});

  const { data, bestPortfolio, result, setData, setResults, setPortfolio } =
    useData();

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

  ///////////////////////////////

  const handleCalculate = async () => {
    setIsCalculating(true); // Set isCalculating to true at the start of calculation
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
      const returns = calculateReturns(data);
      const meanRets = meanReturns(returns);
      const covMat = covarianceMatrix(returns);

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

      const bestPortfolio = geneticOptimization(
        meanRets,
        covMat,
        500,
        100,
        0.1,
        constraintValue,
        optimizationType,
        minWeightsToUse,
        maxWeightsToUse
      );

      if (!bestPortfolio) {
        console.log("Optimization failed");
        return;
      }

      setPortfolio(bestPortfolio);

      const stockName = data
        .map((obj: Stock) => obj.ticker)
        .filter((ticker): ticker is string => !!ticker);

      const result = stockName.map((ticker, i) => ({
        ticker,
        weight: bestPortfolio.weights[i],
      }));

      setResults(result);
      if (bestPortfolio?.fitness > 0) {
        setValue("3"); // Go to step 3
      }
      console.log("Portfolio calculation result:", result);
      console.log("Best Portfolio:", bestPortfolio);
    } catch (error) {
      console.error("Error in handleCalculate:", error);
    } finally {
      setIsCalculating(false); // ✅ Always runs
    }
  };

  return (
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
          className={styles.numberInput}
          type="number"
          min="0"
          max="1"
          step="0.1"
          value={constraintValue}
          onChange={(e) => setConstraintValue(Number(e.target.value))}
          placeholder={
            optimizationType === "riskConstrained" ? "Max Risk" : "Min Return"
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
                  {expandedIndices.has(index) && (
                    <>
                      <label>Min:</label>
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
                      <label>Max:</label>
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
  );
}

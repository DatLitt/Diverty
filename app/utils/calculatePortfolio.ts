import { useData } from "../context/DataContext";
import { Stock } from "../types/test";
import { calculateReturns, meanReturns, covarianceMatrix } from "./mpt";
import { geneticOptimization } from "./optimizer";


 

export async function calculate(data: Stock[]) {
  
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
      return { result, bestPortfolio };
    } catch (error) {
      console.error("Portfolio calculation error:", error);
      return null;
    }
 
  }
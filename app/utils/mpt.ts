import {Stock} from "../types/test";
import { mean, transpose, multiply, sqrt } from "mathjs";

// 1. Calculate weekly returns (percentage change)
export function calculateReturns(
  stocks: Stock[]
) {
  return stocks.map(
    (stock) => stock.data!.map((d) => d.changePercent / 100) // Convert percent to decimal
  );
}

// 2. Calculate mean return per stock
export function meanReturns(returns: number[][]) {
  return returns.map((stockReturns) => mean(stockReturns));
}

// 3. Calculate covariance matrix
export function covarianceMatrix(returns: number[][]) {
  const n = returns.length;
  const matrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      const meanI = mean(returns[i]);
      const meanJ = mean(returns[j]);
      const cov =
        returns[i]
          .map((r, idx) => (r - meanI) * (returns[j][idx] - meanJ))
          .reduce((sum, val) => sum + val, 0) /
        (returns[i].length - 1);
      matrix[i][j] = cov;
    }
  }

  return matrix;
}

// 4. Calculate portfolio metrics
export function portfolioMetrics(
  weights: number[],
  meanReturns: number[],
  covMatrix: number[][]
) {
  const weightsMatrix = transpose([weights]); // Nx1

  // Expected return
  const expectedReturn = multiply(weights, meanReturns) as number;

  // Variance calculation
  const temp = multiply(covMatrix, weightsMatrix); // Nx1
  const varianceMatrix = multiply(weights, temp); // 1x1
  const variance = varianceMatrix[0]; // extract scalar

  const stdDev = sqrt(variance);

  return { expectedReturn, variance, stdDev };
}

// 5. Calculate correlation matrix from returns
export function calculateCorrelation(returns: number[][]) {
  const n = returns.length;
  const corrMatrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    corrMatrix[i] = [];
    const meanI = mean(returns[i]);
    // Calculate standard deviation properly
    const stdDevI = sqrt(
      returns[i].reduce((sum, x) => sum + Math.pow(x - meanI, 2), 0) /
        (returns[i].length - 1)
    );

    for (let j = 0; j < n; j++) {
      const meanJ = mean(returns[j]);
      // Calculate standard deviation properly
      const stdDevJ = sqrt(
        returns[j].reduce((sum, x) => sum + Math.pow(x - meanJ, 2), 0) /
          (returns[j].length - 1)
      );

      // Calculate covariance
      const covariance =
        returns[i].reduce(
          (sum, _, idx) =>
            sum + (returns[i][idx] - meanI) * (returns[j][idx] - meanJ),
          0
        ) /
        (returns[i].length - 1);

      // Calculate correlation
      const correlation =
        Number(covariance as number) / (Number(stdDevI) * Number(stdDevJ));

      corrMatrix[i][j] = Number(correlation.toFixed(4));
    }
  }

  return corrMatrix;
}

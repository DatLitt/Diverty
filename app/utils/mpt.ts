import { Stock } from "../types/test";
import { mean, transpose, multiply, sqrt } from "mathjs";

// Helper function to interpolate missing values
function interpolateData(stocks: Stock[]) {
  // Find the full date range
  const allDates = new Set<string>();
  stocks.forEach(stock => {
    stock.data?.forEach(d => {
      allDates.add(new Date(d.date).toISOString().split('T')[0]);
    });
  });

  const sortedDates = Array.from(allDates).sort();

  return stocks.map(stock => {
    const dateMap = new Map(
      stock.data?.map(d => [
        new Date(d.date).toISOString().split('T')[0],
        d.changePercent
      ]) || []
    );

    // Find gaps and interpolate
    const filledData = sortedDates.map((date, index) => {
      const value = dateMap.get(date);
      if (value !== undefined) return value;

      // Find nearest previous and next values
      let prevIndex = index - 1;
      let nextIndex = index + 1;
      let prevValue: number | undefined;
      let nextValue: number | undefined;

      while (prevIndex >= 0 && prevValue === undefined) {
        prevValue = dateMap.get(sortedDates[prevIndex]);
        prevIndex--;
      }

      while (nextIndex < sortedDates.length && nextValue === undefined) {
        nextValue = dateMap.get(sortedDates[nextIndex]);
        nextIndex++;
      }

      if (prevValue !== undefined && nextValue !== undefined) {
        // Linear interpolation
        const steps = nextIndex - prevIndex;
        const diff = nextValue - prevValue;
        return prevValue + (diff / steps);
      }

      // If no interpolation possible, use nearest value
      return prevValue ?? nextValue ?? 0;
    });

    return filledData.map(value => value / 100); // Convert to decimal
  });
}

// 1. Calculate returns with interpolation
export function calculateReturns(stocks: Stock[]) {
  return interpolateData(stocks);
}

// 2. Calculate mean returns
export function meanReturns(returns: number[][]) {
  return returns.map(stockReturns => mean(stockReturns));
}

// 3. Calculate covariance matrix with interpolated data
export function covarianceMatrix(returns: number[][]) {
  const n = returns.length;
  const matrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      const meanI = mean(returns[i]);
      const meanJ = mean(returns[j]);
      const cov = returns[i]
        .map((r, idx) => (r - meanI) * (returns[j][idx] - meanJ))
        .reduce((sum, val) => sum + val, 0) / (returns[i].length - 1);
      matrix[i][j] = cov;
    }
  }

  return matrix;
}

// 4. Calculate portfolio metrics (unchanged)
export function portfolioMetrics(
  weights: number[],
  meanRets: number[],
  covMatrix: number[][]
) {
  const weightsMatrix = transpose([weights]);
  const expectedReturn = multiply(weights, meanRets) as number;
  const temp = multiply(covMatrix, weightsMatrix);
  const variance = (multiply(weights, temp) as number[])[0];
  const stdDev = sqrt(variance);

  return { expectedReturn, variance, stdDev };
}

// 5. Calculate correlation matrix with interpolated data
export function calculateCorrelation(returns: number[][]) {
  const n = returns.length;
  const corrMatrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    corrMatrix[i] = [];
    const meanI = mean(returns[i]);
    const stdDevI = Number(sqrt(
      returns[i].reduce((sum, x) => sum + Math.pow(x - meanI, 2), 0) /
      (returns[i].length - 1)
    ));

    for (let j = 0; j < n; j++) {
      const meanJ = mean(returns[j]);
      const stdDevJ = Number(sqrt(
        returns[j].reduce((sum, x) => sum + Math.pow(x - meanJ, 2), 0) /
        (returns[j].length - 1)
      ));

      const covariance = returns[i].reduce(
        (sum, _, idx) =>
          sum + (returns[i][idx] - meanI) * (returns[j][idx] - meanJ),
        0
      ) / (returns[i].length - 1);

      const denominator = stdDevI * stdDevJ;
      const correlation = denominator !== 0 ? covariance / denominator : 0;
      corrMatrix[i][j] = Number(correlation.toFixed(4));
    }
  }

  return corrMatrix;
}
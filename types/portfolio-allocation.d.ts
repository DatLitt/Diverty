declare module 'portfolio-allocation' {
  export function meanVarianceOptimizationWeights(
    returns: number[],
    covarianceMatrix: number[][],
    constraints?: {
      minWeights?: number[];
      maxWeights?: number[];
      targetReturn?: number;
    }
  ): number[];

  export function globalMinimumVariance(
    covarianceMatrix: number[][],
    constraints?: {
      minWeights?: number[];
      maxWeights?: number[];
    }
  ): number[];

  export function efficientFrontier(
    returns: number[],
    covarianceMatrix: number[][],
    constraints?: {
      minWeights?: number[];
      maxWeights?: number[];
    }
  ): { weights: number[]; expectedReturn: number; stdDev: number }[];

  export function meanVarianceEfficientFrontierPortfolios(
    mu: number[], // Expected returns array
    sigma: number[][], // Covariance matrix
    constraints?: {
      minWeights?: number[]; // Minimum weights for each asset
      maxWeights?: number[]; // Maximum weights for each asset
    }
  ): { 
    weights: number[]; // Optimal portfolio weights
    expectedReturn: number; // Portfolio expected return
    stdDev: number; // Portfolio risk (standard deviation)
  }[];
}

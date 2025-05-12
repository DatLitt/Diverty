import { geneticOptimization } from "../utils/optimizer"; // adjust import
import { Portfolio } from "../types/test"; // adjust import

export function computeEfficientFrontier(
  meanReturns: number[],
  covMatrix: number[][],
  numPoints = 50
): Portfolio[] {
  const frontier: Portfolio[] = [];
  const minReturn = geneticOptimization(
    meanReturns,
    covMatrix,
    100, // population size
    50, // generations
    0.1, // mutation rate
    0.02, // risk constraint
    "minRisk" // strategy
  ).stdDev;
  const maxReturn = geneticOptimization(
    meanReturns,
    covMatrix,
    100, // population size
    50, // generations
    0.1, // mutation rate
    0.02, // risk constraint
    "noRiskLimit" // strategy
  ).stdDev;

  for (let i = 0; i < numPoints; i++) {
    const targetReturn =
      minReturn + (i / (numPoints - 1)) * (maxReturn - minReturn);

    const portfolio = geneticOptimization(
      meanReturns,
      covMatrix,
      200, // population size
      75, // generations
      0.25, // mutation rate
      targetReturn,
      "riskConstrained"
    );

    frontier.push(portfolio);
  }

  return frontier;
}

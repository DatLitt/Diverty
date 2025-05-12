import { geneticOptimization } from "../utils/optimizer"; // adjust import
import { Portfolio } from "../types/test"; // adjust import

export async function computeEfficientFrontier(
  meanReturns: number[],
  covMatrix: number[][],
  numPoints = 50
): Promise<Portfolio[]> {
  const frontier: Portfolio[] = [];
  const minReturn = geneticOptimization(
    meanReturns,
    covMatrix,
    100, // population size
    50, // generations
    0.1, // mutation rate
    0.02, // risk constraint
    "minRisk" // strategy
  ).meanReturn;
  const maxReturn = geneticOptimization(
    meanReturns,
    covMatrix,
    100, // population size
    50, // generations
    0.1, // mutation rate
    0.02, // risk constraint
    "noRiskLimit" // strategy
  ).meanReturn;

  for (let i = 0; i < numPoints; i++) {
    const targetReturn =
      minReturn + (i / (numPoints - 1)) * (maxReturn - minReturn);

    const portfolio = geneticOptimization(
      meanReturns,
      covMatrix,
      100, // population size
      50, // generations
      0.1, // mutation rate
      targetReturn,
      "returnConstrained"
    );

    frontier.push(portfolio);
  }

  return frontier;
}

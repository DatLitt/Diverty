import { sum } from "mathjs";
import { portfolioMetrics } from "./mpt";
import { Portfolio } from "../types/test";

export function geneticOptimization(
  meanReturnsArr: number[],
  covMatrix: number[][],
  populationSize = 10000,
  generations = 70,
  mutationRate = 0.07,
  constraint = 0.02,
  strategy:
    | "minRisk"
    | "noRiskLimit"
    | "riskConstrained"
    | "returnConstrained" = "riskConstrained",
  minWeights?: number[],
  maxWeights?: number[]
): Portfolio {
  // Use default constraints if not provided
  const patience = 18; // Number of generations to wait before stopping if no improvement
  const minImprovement = 0.00004; // Minimum improvement to consider progress
  const numAssets = meanReturnsArr.length;
  let bestFitness = -Infinity;
  let generationsWithoutImprovement = 0;
  let lastBestFitness = -Infinity;
  let weightsConstraint = false;

  // Set default minWeights and maxWeights dynamically if not provided
  if (!minWeights || minWeights.length === 0) {
    minWeights = Array(numAssets).fill(0);
  }

  if (!maxWeights || maxWeights.length === 0) {
    maxWeights = Array(numAssets).fill(1);
  }

  if (sum(minWeights) > 1 || sum(maxWeights) < 1) {
    throw new Error(
      "Sum of minWeights cannot exceed 1 or sum of maxWeight cannot below 1."
    );
  }
  if (strategy === "noRiskLimit") {
    constraint = 1; // Set a very high constraint for no risk limit
  }
  const defaultMin = 0;
  const defaultMax = 1;
  const finalMinWeights =
    minWeights.length === meanReturnsArr.length
      ? minWeights
      : Array(meanReturnsArr.length).fill(defaultMin);
  const finalMaxWeights =
    maxWeights.length === meanReturnsArr.length
      ? maxWeights
      : Array(meanReturnsArr.length).fill(defaultMax);

  // Initialize population
  let population = initializePopulation(
    meanReturnsArr.length,
    populationSize,
    meanReturnsArr,
    covMatrix,
    finalMinWeights,
    finalMaxWeights
  );

  for (let gen = 0; gen < generations; gen++) {
    // Calculate fitness for each portfolio
    population = population.map((portfolio) => ({
      ...portfolio,
      fitness:
        strategy === "minRisk"
          ? calculateMinRiskFitness(portfolio)
          : strategy === "returnConstrained"
          ? calculateReturnConstrainedFitness(portfolio, constraint)
          : calculateRiskConstrainedFitness(portfolio, constraint),
    }));
    // Sort by fitness
    population.sort((a, b) => b.fitness - a.fitness);
    // Check for early stopping
    bestFitness = population[0].fitness;
    const improvement = bestFitness - lastBestFitness;

    if (improvement < minImprovement) {
      generationsWithoutImprovement++;
      if (generationsWithoutImprovement >= patience) {
        console.log(
          `Early stopping at generation ${gen} due to no improvement`
        );
        break;
      }
    } else {
      generationsWithoutImprovement = 0;
    }

    lastBestFitness = bestFitness;

    // Select top performers
    const elites = population.slice(0, Math.floor(populationSize * 0.2));

    // Create new population
    const newPopulation: Portfolio[] = [...elites];

    // Crossover and mutation
    while (newPopulation.length < populationSize) {
      const parent1 = selectParent(population);
      const parent2 = selectParent(population);
      let child = crossover(parent1, parent2);
      const newMutant = mutationRate * (1 - gen / generations);
      child = mutate(child, newMutant);

      // Apply individual weight constraints
      child.weights = enforceIndividualWeightConstraints(
        child.weights,
        finalMinWeights,
        finalMaxWeights
      );

      // Calculate metrics
      const metrics = portfolioMetrics(
        child.weights,
        meanReturnsArr,
        covMatrix
      );
      child.meanReturn = metrics.expectedReturn;
      child.stdDev =
        typeof metrics.stdDev === "number"
          ? metrics.stdDev
          : (metrics.stdDev as any).re;

      newPopulation.push(child);
    }

    population = newPopulation;
  }

  // Return best portfolio

  return population[0];
}

function initializePopulation(
  numStocks: number,
  populationSize: number,
  meanReturns: number[],
  covMatrix: number[][],
  minWeights: number[],
  maxWeights: number[]
): Portfolio[] {
  return Array.from({ length: populationSize }, () => {
    const weights = Array.from({ length: numStocks }, () => Math.random());
    const constrainedWeights = enforceIndividualWeightConstraints(
      weights,
      minWeights,
      maxWeights
    );
    const metrics = portfolioMetrics(
      constrainedWeights,
      meanReturns,
      covMatrix
    );

    return {
      weights: constrainedWeights,
      meanReturn: metrics.expectedReturn,
      stdDev:
        typeof metrics.stdDev === "number"
          ? metrics.stdDev
          : (metrics.stdDev as any).re,
      fitness: 0,
    };
  });
}

function calculateMinRiskFitness(portfolio: Portfolio): number {
  return 1 / (portfolio.stdDev + 0.0001);
}

function calculateReturnConstrainedFitness(
  portfolio: Portfolio,
  targetReturn: number
): number {
  // Heavy penalty if return is below target
  if (portfolio.meanReturn < targetReturn) {
    return -100 + portfolio.meanReturn; // Gradual penalty based on how far from target
  }

  // If return meets target, optimize for minimum risk
  // Add small bonus for returns closer to target to avoid excessive risk-taking
  const returnBonus = 1 / (Math.abs(portfolio.meanReturn - targetReturn) + 1);
  return 1 / (portfolio.stdDev + 0.0001) + returnBonus;
}

// Original risk-constrained optimization
function calculateRiskConstrainedFitness(
  portfolio: Portfolio,
  stdConstraint: number
): number {
  if (portfolio.stdDev > stdConstraint) {
    return -portfolio.stdDev;
  }
  return portfolio.meanReturn;
}

function selectParent(population: Portfolio[]): Portfolio {
  // Tournament selection
  const tournamentSize = 3;
  let best = population[Math.floor(Math.random() * population.length)];

  for (let i = 0; i < tournamentSize - 1; i++) {
    const contestant =
      population[Math.floor(Math.random() * population.length)];
    if (contestant.fitness > best.fitness) {
      best = contestant;
    }
  }

  return best;
}

function crossover(parent1: Portfolio, parent2: Portfolio): Portfolio {
  const numCrossoverPoints = Math.floor(Math.random() * (3 - 1) + 1); // Choose between 1 and 2 crossover points
  const crossoverPoints = [];

  // Randomly select crossover points
  for (let i = 0; i < numCrossoverPoints; i++) {
    crossoverPoints.push(Math.floor(Math.random() * parent1.weights.length));
  }
  crossoverPoints.sort((a, b) => a - b); // Sort for correct ordering

  // Generate child weights by alternating parent segments
  let childWeights = [...parent1.weights];
  let swap = false;

  for (let i = 0; i < parent1.weights.length; i++) {
    if (crossoverPoints.includes(i)) swap = !swap; // Toggle swap on crossover points
    if (swap) childWeights[i] = parent2.weights[i]; // Swap segments
  }

  return {
    weights: childWeights,
    meanReturn: 0,
    stdDev: 0,
    fitness: 0,
  };
}

function mutate(portfolio: Portfolio, mutationRate: number): Portfolio {
  const mutatedWeights = portfolio.weights.map((weight) => {
    if (Math.random() < mutationRate) {
      return weight * (1 + gaussianRandom(0, mutationRate)); // Random gaussian mutation
    }
    return weight;
  });

  return {
    ...portfolio,
    weights: mutatedWeights,
  };
}

function enforceIndividualWeightConstraints(
  weights: number[],
  minWeights: number[],
  maxWeights: number[]
): number[] {
  let adjustedWeights = [...weights];
  const maxIterations = 1000;
  let iterations = 0;

  while (iterations < maxIterations) {
    // Step 1: Apply individual constraints
    adjustedWeights = adjustedWeights.map((w, i) =>
      Math.min(Math.max(w, minWeights[i]), maxWeights[i])
    );

    // Step 2: Calculate how far we are from 100%
    const totalWeight = sum(adjustedWeights);
    const deficit = 1 - totalWeight;

    if (Math.abs(deficit) < 0.000001) {
      break; // Stop if we're close enough to 100%
    }

    // Step 3: Distribute the deficit while respecting constraints
    const adjustableIndices = adjustedWeights
      .map((w, i) => {
        if (deficit > 0 && w < maxWeights[i]) return i;
        if (deficit < 0 && w > minWeights[i]) return i;
        return -1;
      })
      .filter((i) => i !== -1);

    if (adjustableIndices.length === 0) {
      console.warn("Cannot satisfy constraints - sum may not equal 100%");
      break;
    }

    // Step 4: Distribute deficit equally among adjustable weights
    const adjustment = deficit / adjustableIndices.length;
    adjustableIndices.forEach((i) => {
      adjustedWeights[i] += adjustment;
    });

    iterations++;
  }

  if (iterations === maxIterations) {
    console.warn("Max iterations reached while trying to satisfy constraints");
  }

  return adjustedWeights;
}

function gaussianRandom(mean = 0, stdDev = 1): number {
  let u1 = Math.random();
  let u2 = Math.random();
  let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean; // Scale by standard deviation and shift by mean
}

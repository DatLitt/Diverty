import { sum } from 'mathjs';
import { portfolioMetrics } from './mpt';

interface Portfolio {
  weights: number[];
  meanReturn: number;
  stdDev: number;
  fitness: number;
}

export function geneticOptimization(
  meanReturnsArr: number[],
  covMatrix: number[][],
  populationSize = 100,
  generations = 50,
  mutationRate = 0.1,
  constraint = 0.02,
  strategy: 'minRisk' | 'riskConstrained' | 'returnConstrained' = 'riskConstrained'
): Portfolio {
  // Initialize population
  let population = initializePopulation(meanReturnsArr.length, populationSize, meanReturnsArr, covMatrix);

  for (let gen = 0; gen < generations; gen++) {
    // Calculate fitness for each portfolio
    population = population.map(portfolio => ({
      ...portfolio,
      fitness: strategy === 'minRisk' 
          ? calculateMinRiskFitness(portfolio)
          : strategy === 'riskConstrained'
          ? calculateRiskConstrainedFitness(portfolio, constraint)
          : calculateReturnConstrainedFitness(portfolio, constraint)
    }));
    // Sort by fitness
    population.sort((a, b) => b.fitness - a.fitness);

    // Select top performers
    const elites = population.slice(0, Math.floor(populationSize * 0.2));
    
    // Create new population
    const newPopulation: Portfolio[] = [...elites];

    // Crossover and mutation
    while (newPopulation.length < populationSize) {
      const parent1 = selectParent(population);
      const parent2 = selectParent(population);
      let child = crossover(parent1, parent2);
      child = mutate(child, mutationRate);
      
      // Normalize weights
      const total = sum(child.weights);
      child.weights = child.weights.map(w => w / total);
      
      // Calculate metrics
      const metrics = portfolioMetrics(child.weights, meanReturnsArr, covMatrix);
      child.meanReturn = metrics.expectedReturn;
      child.stdDev = typeof metrics.stdDev === 'number' ? metrics.stdDev : (metrics.stdDev as any).re;
      
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
  covMatrix: number[][]
): Portfolio[] {
  return Array.from({ length: populationSize }, () => {
    const weights = Array.from({ length: numStocks }, () => Math.random());
    const total = sum(weights);
    const normalizedWeights = weights.map(w => w / total);
    const metrics = portfolioMetrics(normalizedWeights, meanReturns, covMatrix);
    
    return {
      weights: normalizedWeights,
      meanReturn: metrics.expectedReturn,
      stdDev: typeof metrics.stdDev === 'number' ? metrics.stdDev : (metrics.stdDev as any).re,
      fitness: 0
    };
  });
}

function calculateMinRiskFitness(portfolio: Portfolio): number {
  return 1 / (portfolio.stdDev + 0.0001);
}

function calculateReturnConstrainedFitness(portfolio: Portfolio, targetReturn: number): number {
  // Heavy penalty if return is below target
  if (portfolio.meanReturn < targetReturn) {
      return -100 + portfolio.meanReturn; // Gradual penalty based on how far from target
  }
  
  // If return meets target, optimize for minimum risk
  // Add small bonus for returns closer to target to avoid excessive risk-taking
  const returnBonus = 1 / (Math.abs(portfolio.meanReturn - targetReturn) + 1);
  return (1 / (portfolio.stdDev + 0.0001)) + returnBonus;
}

// Original risk-constrained optimization
function calculateRiskConstrainedFitness(portfolio: Portfolio, stdConstraint: number): number {
  if (portfolio.stdDev > stdConstraint) {
      return -1;
  }
  return portfolio.meanReturn;
}

function selectParent(population: Portfolio[]): Portfolio {
  // Tournament selection
  const tournamentSize = 3;
  let best = population[Math.floor(Math.random() * population.length)];
  
  for (let i = 0; i < tournamentSize - 1; i++) {
    const contestant = population[Math.floor(Math.random() * population.length)];
    if (contestant.fitness > best.fitness) {
      best = contestant;
    }
  }
  
  return best;
}

function crossover(parent1: Portfolio, parent2: Portfolio): Portfolio {
  // Single point crossover
  const crossoverPoint = Math.floor(Math.random() * parent1.weights.length);
  const childWeights = [
    ...parent1.weights.slice(0, crossoverPoint),
    ...parent2.weights.slice(crossoverPoint)
  ];
  
  return {
    weights: childWeights,
    meanReturn: 0,
    stdDev: 0,
    fitness: 0
  };
}

function mutate(portfolio: Portfolio, mutationRate: number): Portfolio {
  const mutatedWeights = portfolio.weights.map(weight => {
    if (Math.random() < mutationRate) {
      return weight * (1 + (Math.random() - 0.5) * 0.2); // Mutate by ±10%
    }
    return weight;
  });
  
  return {
    ...portfolio,
    weights: mutatedWeights
  };
}
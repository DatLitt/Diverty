declare module 'quadprog' {
    export function solveQP(
      G: number[][], // Quadratic term (covariance matrix)
      c: number[],   // Linear term (returns or zero vector)
      Aeq?: number[][], // Equality constraints matrix
      beq?: number[],   // Equality constraints vector
      lb?: number[],    // Lower bounds
      ub?: number[]     // Upper bounds
    ): number[];
  }
  
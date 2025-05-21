import { geneticOptimization } from "../../utils/optimizer";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      meanRets,
      covMat,
      optimizationType,
      constraintValue,
      minWeights,
      maxWeights,
    } = body;

    const bestPortfolio = geneticOptimization(
      meanRets,
      covMat,
      500, // populationSize
      100, // generations
      0.1, // mutationRate
      constraintValue,
      optimizationType,
      minWeights,
      maxWeights
    );

    return NextResponse.json(bestPortfolio);
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json(
      { error: "Failed to optimize portfolio" },
      { status: 500 }
    );
  }
}

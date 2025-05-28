import { geneticOptimization } from "../../utils/optimizer";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      meanRets,
      covMat,
      populationSize,
      generations,
      optimizationType,
      constraintValue,
      minWeights,
      maxWeights,
    } = body;
    console.log("minWeights:", minWeights);
    console.log("maxWeights:", maxWeights);

    const bestPortfolio = geneticOptimization(
      meanRets,
      covMat,
      populationSize, // populationSize
      generations, // generations
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

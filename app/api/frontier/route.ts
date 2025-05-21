import { computeEfficientFrontier } from "@/app/utils/EfficientFrontier";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { meanRets, covMat } = body;

    const frontier = computeEfficientFrontier(meanRets, covMat, 50);

    return NextResponse.json(frontier);
  } catch (error) {
    console.error("Frontier error:", error);
    return NextResponse.json(
      { error: "Failed to find frontier portfolios" },
      { status: 500 }
    );
  }
}

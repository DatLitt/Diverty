import { Portfolio } from "../types/test";

class FrontierService {
  private isPaused = false;
  private isRunning = false;
  private abortController: AbortController | null = null;

  public async fetchFrontierSequentially(
    numPoints: number,
    meanRets: number[],
    covMat: number[][],
    setFrontier: (data: Portfolio[]) => void
  ) {
    const frontier: Portfolio[] = [];
    this.isRunning = true;
    this.abortController = new AbortController(); // Reset AbortController

    try {
      const minReturn = await this.fetchSinglePoint(
        meanRets,
        covMat,
        "minRisk",
        0.05
      );
      const maxReturn = await this.fetchSinglePoint(
        meanRets,
        covMat,
        "noRiskLimit",
        0.05
      );

      if (minReturn === null || maxReturn === null) {
        console.error("Error fetching min/max returns. Stopping process.");
        this.isRunning = false;
        return;
      }

      for (let i = 0; i < numPoints; i++) {
        while (this.isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Pause loop
        }
        if (!this.isRunning) break;

        const targetReturn =
          minReturn.meanReturn +
          (i / (numPoints - 1)) * (maxReturn.meanReturn - minReturn.meanReturn);
        const portfolio = await this.fetchSinglePoint(
          meanRets,
          covMat,
          "returnConstrained",
          targetReturn
        );

        if (portfolio) {
          frontier.push(portfolio);
          setFrontier([...frontier]);
        }
      }
    } catch (error) {
      console.error("Error fetching frontier:", error);
    } finally {
      this.isRunning = false;
    }
  }

  private async fetchSinglePoint(
    meanRets: number[],
    covMat: number[][],
    optimizationType: string,
    constraintValue: number
  ): Promise<Portfolio> {
    if (!this.abortController) this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meanRets,
          covMat,
          populationSize: 100, // Default population size
          generations: 100, // Default generations
          optimizationType,
          constraintValue,
          minWeights: [],
          maxWeights: [],
        }),
        signal,
      });

      if (!response.ok)
        throw new Error(
          `Fetch failed for optimizationType ${optimizationType}`
        );
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn(`Fetch canceled: ${optimizationType}`);
        return {} as Portfolio; // Return empty portfolio on abort
      }
      console.error("Error fetching single point:", error);
      return {} as Portfolio; // Return null on error
    }
  }

  public pauseFetching() {
    console.log("Pausing fetching...");
    this.isPaused = true;
  }

  public resumeFetching() {
    console.log("Resuming fetching...");
    this.isPaused = false;
  }

  public stopFetching() {
    console.log("Stopping fetching...");
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export const frontierService = new FrontierService();

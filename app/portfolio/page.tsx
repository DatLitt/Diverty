// "use client";
// import styled from "styled-components";
// import { useEffect, useState } from "react";
// import Stock from "../types/test"

// // async function getTrendingStocks() {
// //   const res = await fetch(`/api/search`, {
// //     cache: "force-cache", // Cache result, fetch only once
// //   });

// //   if (!res.ok) {
// //     throw new Error("Failed to fetch trending stocks");
// //   }

// //   return res.json();
// // }

// const Wrapper = styled.div`
//   max-width: 800px;
//   margin: 0 auto;
//   padding: 20px;
// `;

// const Title = styled.h1`
//   font-size: 24px;
//   font-weight: bold;
//   margin-bottom: 20px;
//   color: red
// `;

// const Select = styled.select`
//   padding: 10px;
//   font-size: 16px;
//   margin-bottom: 20px;
// `;

// const Card = styled.div`
//   border: 1px solid #ccc;
//   border-radius: 8px;
//   padding: 15px;
//   margin-bottom: 10px;
//   color: blue;
// `;

// const regions = [
//   { code: 'US', name: 'United States' },
//   { code: 'CA', name: 'Canada' },
//   { code: 'GB', name: 'United Kingdom' },
//   { code: 'DE', name: 'Germany' },
//   { code: 'FR', name: 'France' },
//   { code: 'IT', name: 'Italy' },
//   { code: 'ES', name: 'Spain' },
//   { code: 'AU', name: 'Australia' },
//   { code: 'HK', name: 'Hong Kong' },
//   { code: 'SG', name: 'Singapore' },
//   { code: 'TW', name: 'Taiwan' },
//   { code: 'BR', name: 'Brazil' },
// ];

// async function getTrendingStocks(region = 'US') {
//   const res = await fetch(`/api/search?region=${region}`, { cache: "no-store" });

//   if (!res.ok) {
//     throw new Error("Failed to fetch trending stocks");
//   }

//   return res.json();
// }

// export default function Home() {
//   /* const test = await getTrendingStocks("US") */

//   const [selectedRegion, setSelectedRegion] = useState<string>('US');
//   const [stocks, setStocks] = useState<Stock[]>([{symbol: "...", shortName: "..."}
// ]);
//   console.log(selectedRegion)
//   useEffect(() => {
//     const fetchTrending = async () => {
//       try {
//         //const res = await fetch(`/api/search?region=${selectedRegion}`);
//         const data = await getTrendingStocks(selectedRegion);
//         setStocks(data.quotes || []);
//       } catch (err) {
//         console.error(err);
//         setStocks([]);
//       }
//     };

//     fetchTrending();
//   }, [selectedRegion]);

//    const [data, setData] = useState<any>({});
//      const symbols = "AAPL,MSFT,GOOG,AMZN,META,TSLA,BRK-A";
//      const start = "2017-12-15";
//      const end = "2022-12-16";

//      useEffect(() => {
//          const fetchData = async () => {
//              const response = await fetch(`/api/data?symbols=${symbols}&start=${start}&end=${end}`);
//              const result = await response.json();
//              setData(result);
//          };
//          fetchData();
//      }, []);
//   return (
//     <Wrapper>
//     <Title>Trending Stocks</Title>
//     <Select
//       value={selectedRegion}
//       onChange={(e) => setSelectedRegion(e.target.value)}
//     >
//       {regions.map((region) => (
//         <option key={region.code} value={region.code}>
//           {region.name}
//         </option>
//       ))}
//     </Select>

//     {stocks.map((stock) => (
//       <Card key={stock.symbol}>
//         <h2>{stock.symbol}</h2>
//         <p>{stock.shortName || 'No Name Available'}</p>
//       </Card>
//     ))}
//     <h1>Weekly Stock Data</h1>
//      {Object.entries(data).map(([symbol, stockData]) => (
//          <div key={symbol}>
//              <h2>{symbol}</h2>
//              <ul>
//                  {(stockData as any[]).map((item, index) => (
//                      <li key={index}>
//                          {item.date}: Close - {item.close}, Change - {item.changePercent?.toFixed(2)}%
//                      </li>
//                  ))}
//              </ul>
//          </div>
//      ))}
//   </Wrapper>
//   );
// }
"use client";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  calculateReturns,
  meanReturns,
  covarianceMatrix,
  portfolioMetrics,
  calculateCorrelation,
} from "../utils/mpt";
import { geneticOptimization } from "../utils/optimizer";
import { index } from "mathjs";
import CorrelationHeatmap from "../components/correlationHeatmap";
import Stock from "@/types/test";
import Link from "next/link";
import useSWR from "swr";

const Container = styled.div`
  padding: 2rem;
`;
const Table = styled.table`
  margin-top: 2rem;
  border-collapse: collapse;
  width: 100%;
`;
const ThTd = styled.td`
  border: 1px solid #ccc;
  padding: 8px;
`;

export default function Home() {
  // const [stocks, setStocks] = useState<Stock[]>([]);
  // const [result, setResult] = useState<any>(null);
  // const [correlation, setCorrelation] = useState<number[][]>([]);
  const { data, error, isLoading } = useSWR("/api/stocks", async (url) => {
    const res = await fetch(url, {
      next: { revalidate: 3600000 },
    });
    if (!res.ok) throw new Error("Failed to fetch");
    console.log("Data:", res.json());
    return res.json();
  },{revalidateOnFocus: false, revalidateOnReconnect: false, refreshInterval: 0, dedupingInterval: 60000});

  const portfolioCalculations = useMemo(() => {
  // if (isLoading) return <div>Loading portfolio data...</div>;
  // if (error) return <div>Error: {error}</div>;
  if (data?.stocks) {
    const returns = calculateReturns(data.stocks);
    const meanRets = meanReturns(returns);
    const covMat = covarianceMatrix(returns);

    const minWeights = [0.1, 0, 0, 0, 0, 0, 0]; // Minimum weights for each stock
    const maxWeights = [1, 1, 1, 1, 0.2, 0.5, 1]; // Maximum weights for each stock

    const bestPortfolio = geneticOptimization(
      meanRets,
      covMat,
      500, // populationSize
      100, // generations
      0.1, // mutationRate
      0.06, // constraint (risk or return)
      "riskConstrained", // strategy
      minWeights, // individual minimum weights
      maxWeights // individual maximum weights
    );
    const stockName = data.stocks.map((obj: Stock) => obj.ticker);

    const result = stockName.map((ticker: string, i: number) => ({
      ticker,
      weight: bestPortfolio.weights[i],
    }));
    // const correlationMatrix = calculateCorrelation(returns);
    // setCorrelation(correlationMatrix);
    // console.log("Correlation Matrix:", correlationMatrix); // Add this line
    // console.log("Stocks:", stocks); // Add this line
    console.log(result);
    console.log("Max Mean Return:", bestPortfolio!.meanReturn);
    console.log("Std Dev:", bestPortfolio!.stdDev);

    return { result, bestPortfolio };
  }
  return null;
}, [data]);
if (!portfolioCalculations) return null;
  return (
    <Container>
      <Link href="/">Home</Link>
      <h1>Modern Portfolio Optimizer</h1>
      {/* {result && (
        <>
          <p>Mean Returns: {JSON.stringify(result.meanRets)}</p>
          <p>Covariance Matrix: {JSON.stringify(result.covMat)}</p>
          <p>Weights: {JSON.stringify(result.weights)}</p>
          <p>Expected Return: {result.expectedReturn.toFixed(4)}</p>
          <p>Portfolio Std Dev: {result.stdDev.toFixed(4)}</p>
        </>
      )} */}

      {/* Add the heatmap here */}
      {/* {correlation && correlation.length > 0 && stocks.length > 0 && (
        <CorrelationHeatmap
          correlationMatrix={correlation}
          stockNames={stocks.map((stock) => stock.ticker!)}
        />
      )} */}

      {/* Display Stock Data */}
      {/* {stocks.map((stock) => (
        <div key={stock.ticker}>
          <h2>{stock.ticker}</h2>
          <Table>
            <thead>
              <tr>
                <ThTd>Date</ThTd>
                <ThTd>Close</ThTd>
                <ThTd>Change %</ThTd>
              </tr>
            </thead>
            <tbody>
              {stock.data?.map(
                (
                  d: any,
                  idx: number // Last 10 weeks
                ) => (
                  <tr key={idx}>
                    <ThTd>{new Date(d.date).toLocaleDateString()}</ThTd>
                    <ThTd>{d.close.toFixed(2)}</ThTd>
                    <ThTd>{d.changePercent.toFixed(2)}%</ThTd>
                  </tr>
                )
              )}
            </tbody>
          </Table>
        </div>
      ))} */}
    </Container>
  );
}

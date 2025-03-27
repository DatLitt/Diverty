// "use client";
// import styled from "styled-components";
// import { useEffect, useState } from "react";
// import Stock from "../types/test"

import Link from "next/link";

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



export default function Home() {
  console.log("Home");
  return (
      <Link href="/portfolio">
        Portfolio
        </Link>
  );
}

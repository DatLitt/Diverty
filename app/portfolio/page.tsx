"use client";
import { useState } from "react";
import { useData } from "../context/DataContext";
import Link from "next/link";

export default function Portfolio() {
  const { data, setData } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stocks", {
        next: { revalidate: 3600000 },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const jsonData = await res.json();
      setData(jsonData.stocks);
      console.log(jsonData.stocks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };
  console.log("hello");
  
  return (
    <div>
      <h1>Modern Portfolio Optimizer</h1>
      <button
        onClick={handleFetch}
        disabled={isLoading}
        style={{
          padding: "10px 20px",
          marginBottom: "20px",
          backgroundColor: isLoading ? "#cccccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "Loading..." : "Calculate Portfolio"}
      </button>
      <Link href="/">Go back to the homepage</Link>
      {data && (
        <div>
          <h2>Stock Data:</h2>
          {data?.map((stock, index) => (
            <div key={index}>
              <p>
                <strong>Ticker:</strong> {stock.ticker}
              </p>
              <p>
                <strong>Data Points:</strong>
              </p>
              {stock.data &&
                stock.data.slice(0, 5).map((point: any, idx: number) => (
                  <p key={idx}>
                    Date: {new Date(point.date).toLocaleDateString()} - Close: $
                    {point.close.toFixed(2)} - Change:{" "}
                    {point.changePercent.toFixed(2)}%
                  </p>
                ))}
              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

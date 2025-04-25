"use client";
import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import styles from "../portfolio/page.module.css";
import dynamic from "next/dynamic";

export default function Step3() {
  const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
  const { bestPortfolio, result } = useData();
  const [test123, setTest123] = useState(0);

  const renderTreeMap = () => {
    const div = document.getElementById("myDiv") || undefined;
    if (!result || !bestPortfolio || result.length === 0) return null;

    const series = [
      {
        name: "Weight(%)",
        data: result.map((item) => ({
          x: item.ticker,
          y: +(item.weight * 100).toFixed(2),
        })),
      },
    ];

    const options: ApexCharts.ApexOptions = {
      legend: {
        show: true,
      },
      chart: {
        type: "treemap" as const,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
          export: {
            csv: {
              filename: "portfolio_allocation",
              columnDelimiter: ",",
              headerCategory: `Portfolio Statistics\nExpected Return:,${(
                bestPortfolio.meanReturn * 100
              ).toFixed(2)}%\nRisk (Std Dev):,${(
                bestPortfolio.stdDev * 100
              ).toFixed(2)}%\n\nStock`,
            },
          },
        },
      },
      title: {
        text: "Portfolio Allocation",
        align: "center",
      },
      dataLabels: {
        enabled: true,
        formatter: function (text: string, op: any) {
          return [text, op.value + "%"];
        },
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value.toFixed(2)}%`,
        },
      },
      plotOptions: {
        treemap: {
          colorScale: {
            ranges: [
              {
                from: 0,
                to: 100,
                color: "#00B746",
              },
            ],
          },
        },
      },
    };

    return (
      <Chart
        options={options}
        series={series}
        type="treemap"
        width={div?.offsetWidth! - 40}
        height={"100%"}
      />
    );
  };

  const handleResize = () => {
    setTest123(test123 + 1); // Call the function to recalculate on resize
    console.log("Resized", test123);
  };

  useEffect(() => {
    // Check if window is defined (we're in the browser)
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);

      // Cleanup function to remove event listener
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [test123]);
  return (
    <div className={styles.resultBox}>
      <p className={styles.test123}>{test123}</p>
      {result && result.length > 0 && (
        <>
          <div style={{ fontSize: "2rem" }}>
            <p>Return Rate: {(bestPortfolio.meanReturn * 100).toFixed(2)}%</p>
            <p>Risk: {(bestPortfolio.stdDev * 100).toFixed(2)}%</p>
          </div>
          <div className={styles.treeMapContainer}>{renderTreeMap()}</div>
        </>
      )}
    </div>
  );
}

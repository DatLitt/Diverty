"use client";

import styled from "styled-components";
import { useCallback } from "react";

interface CorrelationHeatmapProps {
  correlationMatrix: number[][];
  stockNames: string[];
}

const HeatmapWrapper = styled.div`
  margin: 2rem 0;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const HeatmapGrid = styled.div<{ size: number }>`
  display: grid;
  grid-template-columns: 80px repeat(
      ${(props) => props.size},
      minmax(60px, 1fr)
    );
  gap: 2px;
  padding: 1rem;
`;

const Cell = styled.div<{ value: number }>`
  aspect-ratio: 1;
  position: relative;
  border-radius: 4px;
  transition: transform 0.2s;
  background-color: ${(props) => {
    const value = props.value;
    // Red to White to Green gradient
    if (value > 0) {
      return `rgb(${255 - value * 255}, 255, ${255 - value * 255})`;
    }
    return `rgb(255, ${255 + value * 255}, ${255 + value * 255})`;
  }};

  &:hover {
    transform: scale(1.1);
    z-index: 1;
    cursor: pointer;
  }

  &::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
    white-space: nowrap;
    pointer-events: none;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const Label = styled.div`
  padding: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  color: #444;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  border-top: 1px solid #eee;
`;

const LegendItem = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;

  &::before {
    content: "";
    width: 20px;
    height: 20px;
    background: ${(props) => props.color};
    border-radius: 4px;
  }
`;

export default function CorrelationHeatmap({
  correlationMatrix,
  stockNames,
}: CorrelationHeatmapProps) {
  const getTooltip = useCallback(
    (value: number, stock1: string, stock2: string) => {
      return `${stock1} → ${stock2}: ${value.toFixed(2)}`;
    },
    []
  );

  return (
    <HeatmapWrapper>
      <h2 style={{ margin: "0 0 1rem", color: "#333" }}>
        Stock Correlation Matrix
      </h2>
      <HeatmapGrid size={stockNames.length}>
        <div /> {/* Empty corner */}
        {stockNames.map((name) => (
          <Label key={`header-${name}`}>{name}</Label>
        ))}
        {stockNames.map((rowName, i) => (
          <div key={`row-container-${rowName}`} style={{ display: "contents" }}>
            <Label key={`row-${rowName}`}>{rowName}</Label>
            {correlationMatrix[i].map((value, j) => (
              <Cell
                key={`${i}-${j}`}
                value={value}
                data-tooltip={getTooltip(value, rowName, stockNames[j])}
              />
            ))}
          </div>
        ))}
      </HeatmapGrid>
      <Legend>
        <LegendItem color="rgb(255, 0, 0)">Strong Negative (-1)</LegendItem>
        <LegendItem color="rgb(255, 255, 255)">No Correlation (0)</LegendItem>
        <LegendItem color="rgb(0, 255, 0)">Strong Positive (+1)</LegendItem>
      </Legend>
    </HeatmapWrapper>
  );
}

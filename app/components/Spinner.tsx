import React from "react";

export function Spinner() {
  const spinnerStyle: React.CSSProperties = {
    margin: "4.8rem auto",
    width: "6.4rem",
    aspectRatio: "1",
    borderRadius: "50%",
    background: `
      radial-gradient(farthest-side, var(--primary) 94%, #0000) top/10px 10px no-repeat,
      conic-gradient(#0000 30%, var(--primary))
    `,
    WebkitMask:
      "radial-gradient(farthest-side, #0000 calc(100% - 10px), #000 0)",
    animation: "rotate 1.5s infinite linear",
  };

  return (
    <>
      <style>
        {`
          @keyframes rotate {
            to {
              transform: rotate(1turn);
            }
          }
        `}
      </style>
      <div style={spinnerStyle} />
    </>
  );
}

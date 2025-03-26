"use client";
import { ReactNode } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export default function StyledComponentsRegistry({
  children,
}: {
  children: ReactNode;
}) {
  const sheet = new ServerStyleSheet();

  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return styles;
  });

  return <StyleSheetManager sheet={sheet.instance}>{children}</StyleSheetManager>;
}
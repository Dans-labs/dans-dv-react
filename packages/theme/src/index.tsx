import type { ReactNode } from "react";
import { ThemeProvider, createTheme, Theme } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";
import { baseTheme } from "./basetheme";

export const ThemeWrapper = ({
  theme,
  children,
}: {
  theme?: Partial<Theme>;
  children: ReactNode;
}) => {
  const customTheme = createTheme(deepmerge(baseTheme, theme));
  return (
    <ThemeProvider theme={customTheme}>
      {children}
    </ThemeProvider>
  );
};
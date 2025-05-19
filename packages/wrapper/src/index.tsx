import type { ReactNode } from "react";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, Theme } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";
import { baseTheme } from "./basetheme";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import CssBaseline from '@mui/material/CssBaseline';
import { ApiTokenProvider } from './apiTokenContext';

export function createApp({ app, theme }: { app: ReactNode; theme?: Partial<Theme> }) {
  const container = document.querySelector('#dans-dv-react-root');
  const shadowContainer = container?.attachShadow({ mode: 'open' });
  const shadowRootElement = document.createElement('div');
  shadowContainer?.appendChild(shadowRootElement);

  const cache = createCache({
    key: 'css',
    prepend: true,
    container: shadowContainer,
  });

  // Set the main font size to 16px, as MUI works with Rems. DV with px, so that shouldn´t matter
  document.documentElement.style.fontSize = '16px';

  const customTheme = createTheme(deepmerge(baseTheme(shadowRootElement), theme));

  createRoot(shadowRootElement).render(
    <StrictMode>
      <CacheProvider value={cache}>
        <ThemeProvider theme={customTheme}>
          <ApiTokenProvider>
            <CssBaseline />
            {app}
          </ApiTokenProvider>
        </ThemeProvider>
      </CacheProvider>
    </StrictMode>
  );
}
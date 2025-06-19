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
import { ShadowRootContext } from './shadowRootContext';

export function createApp({ app, appendToId, theme }: { app: ReactNode; appendToId: string; theme?: Partial<Theme> }) {
  const targetElement = document.querySelector(`#${appendToId}`);
  const shadowHost = document.createElement('div');

  // Insert the shadow host after the target element
  targetElement?.parentNode?.insertBefore(shadowHost, targetElement.nextSibling);

  // Create Shadow DOM on the new host
  const shadowContainer = shadowHost.attachShadow({ mode: 'open' });

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

  const reactAppContainer = document.createElement('div');
  shadowRootElement.appendChild(reactAppContainer);

  createRoot(reactAppContainer).render(
    <StrictMode>
      <CacheProvider value={cache}>
        <ThemeProvider theme={customTheme}>
          <ShadowRootContext.Provider value={shadowContainer}>
            <ApiTokenProvider>
              <CssBaseline />
              {app}
            </ApiTokenProvider>
          </ShadowRootContext.Provider>
        </ThemeProvider>
      </CacheProvider>
    </StrictMode>
  );
}
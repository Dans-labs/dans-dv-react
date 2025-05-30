import { createTheme } from "@mui/material/styles";

export function baseTheme(shadowRootElement: HTMLElement) {
  return (
    createTheme({
      components: {
        MuiPopover: {
          defaultProps: {
            container: shadowRootElement,
          },
        },
        MuiPopper: {
          defaultProps: {
            container: shadowRootElement,
          },
          styleOverrides: {
            root: {
              zIndex: '10000 !important',
            }
          }
        },
        MuiModal: {
          defaultProps: {
            container: shadowRootElement,
          },
        },
        MuiDrawer: {
          defaultProps: {
            container: shadowRootElement,
          },
          styleOverrides: {
            root: {
              zIndex: 9999,
            }
          }
        },
      },
    })
  )
};

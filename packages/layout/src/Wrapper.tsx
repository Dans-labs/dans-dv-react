import Box from '@mui/material/Box';
import { ReactNode } from 'react';

export function BoxWrap({width, children}: {width?: number, children: ReactNode}) {
  return (
    <Box sx={{ maxWidth: width ? `${width}rem` : '40rem' }}>
      {children}
    </Box>
  );
}
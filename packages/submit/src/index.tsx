import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { getUserFriendlyError } from './api';
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export function Submit({ disabled, isLoading, isError, error, isSuccess, onClick }: { 
  disabled: boolean; 
  isLoading: boolean; 
  isError: boolean; 
  error?: FetchBaseQueryError; 
  isSuccess: boolean;
  onClick?: () => void;
 }) {  
  return (
    <>
      {isError && <Alert severity="error" sx={{mb: 2}}>Submission failed. {getUserFriendlyError(error)}</Alert>}
      {isSuccess && <Alert severity="success" sx={{mb: 2}}>Submission succesful. Refresh the page to see your changes reflected in Dataverse.</Alert>}
      <Button 
        variant="contained" 
        size="large"
        disabled={disabled || isLoading || isSuccess} 
        type="submit"
        onClick={() => typeof onClick === "function" && onClick()}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <span>Submit</span>{isLoading && <CircularProgress size={16} />}
        </Stack> 
      </Button>
    </>
  );
}
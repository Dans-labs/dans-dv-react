import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { useApiToken } from "@dans-dv/wrapper";
import { useSubmitDataMutation } from './api';

export function Submit({ disabled, getData }: { disabled: boolean; getData: any }) {
  const { apiToken, doi } = useApiToken();
  const [ submitData, { isLoading, isSuccess } ] = useSubmitDataMutation();

  async function handleSubmit() {
    const data = await getData();
    console.log(data);

    submitData({
      apiToken: apiToken,
      doi: doi,
    });
  }
  
  return (
    <Button 
      variant="contained" 
      size="large"
      disabled={disabled || isLoading} 
      onClick={handleSubmit}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <span>Submit</span>{isLoading && <CircularProgress size={16} />}
      </Stack> 
    </Button>
  );
}
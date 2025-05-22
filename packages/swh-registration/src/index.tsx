import { useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { TextField } from '@dans-dv/inputs';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { getField, setField } from './slice';
import { useLazyFetchCodemetaQuery } from "./codemetaApi";
import type { SWHFormState } from "./slice";
import type { TypedUseSelectorHook } from "react-redux";
import Alert from '@mui/material/Alert';
import CircularProgress from "@mui/material/CircularProgress";
import { Submit, useSubmitDataMutation } from "@dans-dv/submit";
import { useApiToken } from "@dans-dv/wrapper";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

type Person = {
  givenName: string;
  familyName: string;
  '@id'?: string;
};

type Inputs = {
  repoUrl: string;
  authors?: Person[];
  contributors?: Person[];
}

type AppDispatch = (action: any) => any;
export type RootState = {swh: SWHFormState};

const urlRegex = /^https?:\/\/[\w.-]+(\.[\w.-]+)+[/\w\-._~:/?#[\]@!$&'()*+,;=.]*$/i;

export default function Form({ useAppDispatch, useAppSelector }: {
  useAppDispatch: () => AppDispatch;
  useAppSelector: TypedUseSelectorHook<RootState>;
}) {
  const dispatch = useAppDispatch();
  const { apiToken, doi } = useApiToken();
  const [ submitData, { isLoading: submitLoading, isSuccess: submitSuccess, isError: submitError, error: submitErrorMessage } ] = useSubmitDataMutation();

  // Pull initial values from Redux
  const repoUrl = useAppSelector(getField('repoUrl'));

  const [fetchCodemeta, { currentData, isLoading, isSuccess, isError, error, isUninitialized, reset }] = useLazyFetchCodemetaQuery();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset: resetForm,
  } = useForm<Inputs>({
    defaultValues: async () => { 
      // populate the form with the initial values from Redux
      const meta: any = urlRegex.test(repoUrl) ? fetchCodemeta(repoUrl) : { author: [], contributor: [] };
      return ({ 
        repoUrl: repoUrl, 
        authors: meta.author, 
        contributors: meta.contributor,
      })
    }
  });

  // Watch for changes to the repoUrl field to enable/disable the fetch button
  const repoUrlValue = watch('repoUrl');

  // Poppulate the authors and contributors form fields with data from the codemeta.json file
  useEffect(() => {
    if (currentData) {
      if (currentData.author) {
        setValue('authors', currentData.author);
      }
      if (currentData.contributor) {
        setValue('contributors', currentData.contributor);
      }
    }
  }, [currentData, setValue]);

  // format data and submit to the API
  const onSubmit: SubmitHandler<Inputs> = (data) => submitData({
    data: data,
    apiToken: apiToken,
    doi: doi,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h5" gutterBottom>Register software with Software Heritage</Typography>
      <Typography mb={4}>Enter a repository URL to submit to software heritage. If you included a codemeta.json file in your repository, we will try to fetch that to add additional authors to your dataset.</Typography>
      <Stack direction="row" spacing={1} mb={2} alignItems="flex-start">
        <Controller
          name="repoUrl"
          control={control}
          rules={{ 
            required: true,
            pattern: {
              value: urlRegex,
              message: "Enter a valid repository URL"
            }
          }}
          render={({ field }) => 
            <TextField 
              {...field} 
              label="Repository URL"
              errors={errors.repoUrl}
              required
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val);
                dispatch(setField({ field: 'repoUrl', value: val }));
                reset();
                resetForm({ repoUrl: val, authors: [], contributors: [] });
              }}
            />
          }
        />
        <Button variant="contained" onClick={() => fetchCodemeta(repoUrl)} sx={{ pt: 2, pb: 2 }} disabled={!urlRegex.test(repoUrlValue) || isLoading}>
          <Stack direction="row" spacing={1} alignItems="center">
            <span>Fetch</span>{isLoading && <CircularProgress size={16} />}
          </Stack>
        </Button>
      </Stack>
      { isUninitialized && <Alert severity="info" sx={{mb: 2}}>Please enter a repository URL and click "Fetch" to load the authors from the codemeta.json file.</Alert> }
      { !isUninitialized && isError && 
        <Alert severity="warning" sx={{mb: 2}}>
          {
            (error as FetchBaseQueryError)?.status === 404 
            ? "Repository not found or unreachable." 
            : `${(error as FetchBaseQueryError)?.data} You can add additional authors and contributors manually using the Dataverse metadata editor. If you believe your Git URL is correct, you can still submit your data to Software Heritage.`
          }
        </Alert> 
      }
      { !isUninitialized && isSuccess && 
        <Alert severity="success" sx={{mb: 2}}>
          Successfully fetched codemeta.json. Check the authors and contributors fetched below. Missing people? Please update your codemeta.json file. Otherwise, hit submit!
        </Alert> 
      }
      { currentData && currentData.author && <AuthorWrapper items={currentData.author} type="author" title="Authors" /> }
      { currentData && currentData.contributor && <AuthorWrapper items={currentData.contributor} type="contributor" title="Contributors" /> }
      <Submit 
        disabled={!isValid || (error as FetchBaseQueryError)?.status === 404 || isUninitialized} 
        isLoading={submitLoading} 
        isError={!isUninitialized && submitError} 
        isSuccess={submitSuccess} 
        error={submitErrorMessage as FetchBaseQueryError}
      />
    </form>
  );
}

function AuthorWrapper({items, type, title}) {
  return (
    <>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      {items.map((item, i) =>
        <Stack key={i} direction="row" spacing={1} mb={2}>
          <TextField 
            label="Name"
            value={`${item.familyName}, ${item.givenName}`}
            disabled
            size="small"
          />
          <TextField 
            label="Identifier"
            value={item['@id']}
            disabled
            size="small"
          />
        </Stack>
      )}
    </>
  );
}
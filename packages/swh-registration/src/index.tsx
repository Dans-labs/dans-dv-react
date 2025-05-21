import { useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { TextField } from '@dans-dv/inputs';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { getField, setField } from './slice';
import { useLazyFetchCodemetaQuery } from "./codemetaApi";
import type { RootState, AppDispatch } from "@dans-dv/selector";
import type { TypedUseSelectorHook } from "react-redux";
import Alert from '@mui/material/Alert';
import CircularProgress from "@mui/material/CircularProgress";

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

const gitRegex = /^(https?:\/\/|git@)(github\.com|gitlab\.com|bitbucket\.org)([:/])([\w./-]+)(\.git)?$/;

export default function Form({ useAppDispatch, useAppSelector }: {
  useAppDispatch: () => AppDispatch;
  useAppSelector: TypedUseSelectorHook<RootState>;
}) {
  const dispatch = useAppDispatch();

  // Pull initial values from Redux
  const repoUrl = useAppSelector(getField('repoUrl'));
  const author = useAppSelector(getField('author'));

  const [fetchCodemeta, { currentData, isLoading, isSuccess, isError, isUninitialized, reset }] = useLazyFetchCodemetaQuery();

  useEffect(() => {
    if (repoUrl) {
      fetchCodemeta(repoUrl);
    }
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset: resetForm,
  } = useForm<Inputs>({
    defaultValues: { repoUrl, authors: [], contributors: [] }
  });

  const repoUrlValue = watch('repoUrl');

  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data);

  // Populate form state when fetch is successful:
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
              value: gitRegex,
              message: "Enter a valid GitHub, GitLab, or Bitbucket repository URL"
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
        <Button variant="contained" onClick={() => fetchCodemeta(repoUrl)} sx={{ pt: 2, pb: 2 }} disabled={!gitRegex.test(repoUrlValue) || isLoading}>
          <Stack direction="row" spacing={1} alignItems="center">
            <span>Fetch</span>{isLoading && <CircularProgress size={16} />}
          </Stack>
        </Button>
      </Stack>
      { isUninitialized && <Typography color="info">Please enter a repository URL and click "Fetch" to load the authors from the codemeta.json file.</Typography> }
      { isError && <Alert severity="warning" sx={{mb: 2}}>Could not find a codemeta.json. You can add additional authors and contributors manually using the Dataverse metadata editor. If you believe your Git URL is correct, you can still submit your data to Software Heritage.</Alert> }
      { isSuccess && <Alert severity="success" sx={{mb: 2}}>Successfully fetched codemeta.json. Check the authors and contributors fetched below. Missing people? Please update your codemeta.json file. Otherwise, hit submit!</Alert> }
      { currentData && currentData.author && <AuthorWrapper items={currentData.author} type="author" title="Authors" /> }
      { currentData && currentData.contributor && <AuthorWrapper items={currentData.contributor} type="contributor" title="Contributors" /> }
      <Button type="submit" variant="contained" size="large" disabled={!isValid}>Submit</Button>
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
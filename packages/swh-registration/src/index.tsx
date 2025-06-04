import { useEffect } from "react";
import { useForm, type SubmitHandler, Controller, useFieldArray } from "react-hook-form";
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
import Box from "@mui/material/Box";
import { Submit, useSubmitDataMutation } from "@dans-dv/submit";
import { useApiToken } from "@dans-dv/wrapper";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

type Person = {
  givenName: string;
  familyName: string;
  '@id'?: string;
};

type Inputs = {
  repository_url: string;
  author: Person[];
  name: string;
  description: string;
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
  const url = useAppSelector(getField('url'));
  const author = useAppSelector(getField('author'));
  const name = useAppSelector(getField('name'));
  const description = useAppSelector(getField('description'));

  console.log(description)

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
      // urlRegex.test(url) && await fetchCodemeta(url);
      return ({ 
        repository_url: url, 
        author: author || currentData?.author, 
        name: name || currentData?.name,
        description: description || currentData?.description,
      })
    }
  });

  // Watch for changes to the repoUrl field to enable/disable the fetch button
  const repoUrlValue = watch('repository_url');

  // Poppulate the form fields with data from the codemeta.json file
  useEffect(() => {
    if (currentData) {
      currentData.author && setValue('author', currentData.author);
      currentData.name && setValue('name', currentData.name);
      currentData.description && setValue('description', currentData.description);
    }
  }, [currentData, setValue]);

  // format data and submit to the API
  const onSubmit: SubmitHandler<Inputs> = (data) => submitData({
    data: data,
    apiToken: apiToken,
    id: doi,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h5" gutterBottom>Register software with Software Heritage</Typography>
      <Typography mb={4}>Enter a repository URL to submit to software heritage. If you included a codemeta.json file in your repository, we will try to fetch that to add additional authors to your dataset.</Typography>
      <Stack direction="row" spacing={1} mb={2} alignItems="flex-start">
        <Controller
          name="repository_url"
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
              errors={errors.repository_url}
              required
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val);
                dispatch(setField({ field: 'url', value: val }));
                reset();
                resetForm({ repository_url: val, author: [], name: '', description: '' });
              }}
            />
          }
        />
        <Button variant="contained" onClick={() => fetchCodemeta(url)} sx={{ pt: 2, pb: 2 }} disabled={!urlRegex.test(repoUrlValue) || isLoading}>
          <Stack direction="row" spacing={1} alignItems="center">
            <span>Fetch</span>{isLoading && <CircularProgress size={16} />}
          </Stack>
        </Button>
      </Stack>
      { isUninitialized && <Alert severity="info" sx={{mb: 2}}>Please enter a repository URL and click "Fetch" to load data from the codemeta.json file.</Alert> }
      { !isUninitialized && isError && 
        <Alert severity="warning" sx={{mb: 2}}>
          {
            (error as FetchBaseQueryError)?.status === 404 
            ? "Repository not found or unreachable." 
            : `${(error as FetchBaseQueryError)?.data} If you believe your Git URL is correct, you can still submit your data to Software Heritage.`
          }
        </Alert> 
      }
      { !isUninitialized && isSuccess && 
        <Alert severity="success" sx={{mb: 2}}>
          Successfully fetched codemeta.json. Confirm the data fetched below and hit submit!
        </Alert> 
      }
      { currentData && 
        <Controller
          name="name"
          control={control}
          rules={{required: true}}
          render={({ field }) => 
            <TextField 
              {...field} 
              label="Software name"
              errors={errors.name}
              required
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val);
                dispatch(setField({ field: 'name', value: val }));
              }}
            />
          }
        />
      }
      { currentData && 
        <Controller
          name="description"
          control={control}
          rules={{required: true}}
          render={({ field }) => 
            <TextField 
              {...field} 
              label="Software description"
              errors={errors.description}
              required
              multiline
              rows={3}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val);
                dispatch(setField({ field: 'description', value: val }));
              }}
            />
          }
        />
      }
      { currentData && <AuthorArray control={control} /> }
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

function AuthorArray({ control }: { control: any }) {
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: 'author', // unique name for your Field Array
  });

  return (
    fields.map((field, index) => (
      <Stack direction="row">
        <Controller
          name={`author.${index}.name`}
          control={control}
          render={({ field: innerField }) => 
            <TextField 
              {...innerField} 
              label="Name"
              required
              defaultValue={`${field.givenName || ''} ${field.familyName || ''}`}
              onChange={(e) => {
                const val = e.target.value;
                innerField.onChange(val);
                // dispatch(setField({ field: 'repoUrl', value: val }));
              }}
            />          
          }
        />
        { fields.length > 1 &&
          <button type="button" onClick={() => remove(index)}>Delete</button>
        }
        {index === fields.length - 1 && 
          <button
            type="button"
            onClick={() => append({ givenName: '', familyName: '' })}
          >
            append
          </button>
        }
      </Stack>
    ))
  );
}
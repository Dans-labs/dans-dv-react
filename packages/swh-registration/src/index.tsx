import { useEffect } from "react";
import { useForm, type SubmitHandler, Controller, useFieldArray } from "react-hook-form";
import { TextField } from '@dans-dv/inputs';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { getField, setField, setFieldArray, resetValues } from './slice';
import { useLazyFetchCodemetaQuery } from "./codemetaApi";
import type { SWHFormState } from "./slice";
import type { TypedUseSelectorHook } from "react-redux";
import Alert from '@mui/material/Alert';
import CircularProgress from "@mui/material/CircularProgress";
import { Submit, useSubmitDataMutation } from "@dans-dv/submit";
import { useApiToken } from "@dans-dv/wrapper";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import IconButton from "@mui/material/IconButton";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { TabHeader, BoxWrap } from "@dans-dv/layout";

type Inputs = {
  repository_url: string;
  software_author: string[];
  software_name: string;
  software_description: string;
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
  const url = useAppSelector(getField('repository_url'));
  const author = useAppSelector(getField('software_author'));
  const name = useAppSelector(getField('software_name'));
  const description = useAppSelector(getField('software_description'));

  const [fetchCodemeta, { currentData, isLoading, isSuccess, isError, error, isUninitialized, reset }] = useLazyFetchCodemetaQuery();

  const hasData = !isUninitialized || name.length > 0 || author.length > 0 || description.length > 0;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset: resetForm,
  } = useForm<Inputs>({
    defaultValues: { 
      repository_url: url, 
      software_author: author, 
      software_name: name,
      software_description: description,
    }
  });

  // Watch for changes to the repoUrl field to enable/disable the fetch button
  const repoUrlValue = watch('repository_url');

  // Poppulate the form fields with data from the codemeta.json file, and populate the Redux store with the same data
  useEffect(() => {
    if (isSuccess && currentData) {
      const authors = currentData.author?.map(author => `${author.givenName} ${author.familyName}`) || [];
      currentData.author 
        && dispatch(setField({field: 'software_author', value: authors})) 
        && setValue('software_author', authors);
      currentData.name 
        && dispatch(setField({field: 'software_name', value: currentData.name})) 
        && setValue('software_name', currentData.name);
      currentData.description 
        && dispatch(setField({field: 'software_description', value: currentData.description})) 
        && setValue('software_description', currentData.description);
    }
  }, [isSuccess, currentData]);

  // format data and submit to the API
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    const formattedData = {...data, repository_url: { value: data.repository_url }};
    submitData({
      data: formattedData,
      apiToken: apiToken,
      id: doi,
    });
  }

  return (
    <BoxWrap>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TabHeader 
          title="Register software with Software Heritage"
          subtitle="Enter a repository URL to submit to software heritage. If you included a codemeta.json file in your repository, we will try to fetch that to add additional authors to your dataset."
        />
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
                  dispatch(resetValues()); // reset other fields when URL changes
                  reset();
                  resetForm({ repository_url: val, software_author: [], software_name: '', software_description: '' });
                }}
                onBlur={(e) => dispatch(setField({ field: 'repository_url', value: e.target.value }))}
              />
            }
          />
          <Button variant="contained" onClick={() => fetchCodemeta(url)} sx={{ pt: 2, pb: 2 }} disabled={!urlRegex.test(repoUrlValue) || isLoading}>
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Fetch</span>{isLoading && <CircularProgress size={16} />}
            </Stack>
          </Button>
        </Stack>
        { !hasData && <Alert severity="info" sx={{mb: 2}}>Please enter a repository URL and click "Fetch" to load data from the codemeta.json file.</Alert> }
        { !isUninitialized && isError && 
          <Alert severity="warning" sx={{mb: 2}}>{(error as FetchBaseQueryError).data as string}</Alert> 
        }
        { !isUninitialized && isSuccess && 
          <Alert severity="success" sx={{mb: 2}}>
            Successfully fetched codemeta.json. Confirm the data fetched below and hit submit!
          </Alert> 
        }
        { hasData && 
          <Controller
            name="software_name"
            control={control}
            rules={{required: true}}
            render={({ field }) => 
              <TextField 
                {...field} 
                label="Software name"
                errors={errors.software_name}
                required
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={(e) => dispatch(setField({ field: 'software_name', value: e.target.value }))}
              />
            }
          />
        }
        { hasData && 
          <Controller
            name="software_description"
            control={control}
            rules={{required: true}}
            render={({ field }) => 
              <TextField 
                {...field} 
                label="Software description"
                errors={errors.software_description}
                required
                multiline
                rows={3}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={(e) => dispatch(setField({ field: 'software_description', value: e.target.value }))}
              />
            }
          />
        }
        { hasData && <AuthorArray control={control} dispatch={dispatch} /> }
        <Submit 
          disabled={!isValid || !hasData} 
          isLoading={submitLoading} 
          isError={!isUninitialized && submitError} 
          isSuccess={submitSuccess} 
          error={submitErrorMessage as FetchBaseQueryError}
        />
      </form>
    </BoxWrap>
  );
}

function AuthorArray({ control, dispatch }: { control: any, dispatch: AppDispatch }) {
  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm 
    name: 'software_author', // unique name for your Field Array
  });

  useEffect(() => {
    // If there are no authors, just add one empty field
    if (fields.length === 0) {
      append('');
    }
  }, [fields]);

  return (
    fields.map((field, index) => (
      <Stack direction="row" mb={2} key={field.id}>
        <Controller
          name={`software_author.${index}`}
          control={control}
          rules={{required: true}}
          render={({ field: innerField }) => 
            <TextField 
              {...innerField} 
              label="Author name"
              required
              sx={{mb: 0}}
              onChange={(e) => innerField.onChange(e.target.value)}
              onBlur={(e) => dispatch(setFieldArray({field: 'software_author', value: e.target.value, index: index}))}
            />          
          }
        />
        { fields.length > 1 &&
          <IconButton
            color="error"
            size="small"
            onClick={() => remove(index)}
          >
            <RemoveCircleOutlineIcon fontSize="small" />
          </IconButton>
        }
        {index === fields.length - 1 && 
          <IconButton
            color="primary"
            size="small"
            onClick={() => append('')}
          >
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        }
      </Stack>
    ))
  );
}
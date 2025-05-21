import { useApiToken } from "@dans-dv/wrapper";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { TextField } from '@dans-dv/inputs';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { getField, setField } from './slice';
import type { RootState, AppDispatch } from "@dans-dv/selector";
import type { TypedUseSelectorHook } from "react-redux";

type Inputs = {
  repoUrl: string;
  author: string;
}

export default function Form({ useAppDispatch, useAppSelector }: {
  useAppDispatch: () => AppDispatch;
  useAppSelector: TypedUseSelectorHook<RootState>;
}) {
  const dispatch = useAppDispatch();
  const { apiToken } = useApiToken();

  // Pull initial values from Redux
  const repoUrl = useAppSelector(getField('repoUrl'));
  const author = useAppSelector(getField('author'));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: { repoUrl, author }
  });

  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h5" gutterBottom>Register software with Software Heritage</Typography>
      <Typography mb={4}>Some description</Typography>
      {/* TODO has to retrieve potential data from codemeta.json file, see https://github.com/codemeta */}
      <Controller
        name="repoUrl"
        control={control}
        rules={{ required: true }}
        render={({ field }) => 
          <TextField 
            {...field} 
            label="Repository URL"
            valid={!errors.repoUrl}
            required
            onChange={(e) => {
              const val = e.target.value;
              field.onChange(val);
              dispatch(setField({ field: 'repoUrl', value: val }));
            }}
          />
        }
      />
      <Controller
        name="author"
        control={control}
        rules={{ required: true }}
        render={({ field }) => 
          <TextField 
            {...field} 
            label="Author"
            valid={!errors.author}
            required
            onChange={(e) => {
              const val = e.target.value;
              field.onChange(val);
              dispatch(setField({ field: 'author', value: val }));
            }}
          />
        }
      />

      <Button type="submit" variant="contained" size="large">Submit</Button>
      {apiToken}
      </form>
  );
}
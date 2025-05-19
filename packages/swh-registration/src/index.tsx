import { useApiToken } from "@dans-dv/wrapper";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { TextField } from '@dans-dv/inputs';

type Inputs = {
  repoUrl: string
}

export default function Form() {
  const { apiToken } = useApiToken();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  console.log(errors)

  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1>Register software with Software Heritage</h1>
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
          />
        }
      />
      <input type="submit" />
      {apiToken}
      </form>
  );
}
import TextField, { type TextFieldProps } from '@mui/material/TextField';

export function TextFieldInput({ 
    errors,
    ...props
}: {
  errors?: any;
} & TextFieldProps) {  
    return (
      <TextField
        fullWidth
        error={errors}
        helperText={errors && (errors?.message || "Required field")}
        variant="outlined"
        sx={{ mb: 2 }}
        {...props}
      />
    );
  };
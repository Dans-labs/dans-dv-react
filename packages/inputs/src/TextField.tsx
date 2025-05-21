import TextField from '@mui/material/TextField';

export function TextFieldInput({ 
    label, 
    valid,
    required,
    multiline,
    onChange,
    value,
    ...props
}: {
    label: string; 
    valid: boolean;
    required: boolean; 
    multiline?: boolean;
    onChange: (e: any) => void; 
    value: string;
}) {  
    console.log(props)
    return (
      <TextField
        fullWidth
        error={!valid}
        helperText={!valid && "Incorrecty entered"}
        variant="outlined"
        label={label}
        required={required}
        multiline={multiline}
        rows={multiline ? 4 : undefined}
        value={value}
        onChange={onChange}
        sx={{ mb: 2 }}
      />
    );
  };
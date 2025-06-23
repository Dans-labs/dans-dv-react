import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import LaunchIcon from "@mui/icons-material/Launch";

type Value = {
  label: string;
  value: string;
  categoryLabel?: string;
  categoryContent?: string;
  extraLabel?: string;
  extraContent?: string;
  idLabel?: string;
  id?: string;
};

export function AutocompleteAPIField({
  inputValue,
  setInputValue,
  debouncedInputValue,
  data,
  isLoading,
  isFetching,
  multiSelect,
  label,
  onSave,
  value,
  disabled,
}: {
  inputValue: string;
  setInputValue: (value: string) => void;
  debouncedInputValue: string;
  data?: any;
  isLoading: boolean;
  isFetching: boolean;
  multiSelect?: boolean;
  label?: string;
  onSave: (data: Value[]) => void;
  value: Value | Value[];
  disabled?: boolean;
}) {  
  console.log
  return (
    <Autocomplete
      multiple={multiSelect}
      fullWidth
      includeInputInList
      options={
        (
          inputValue &&
          debouncedInputValue === inputValue &&
          data &&
          data.arg === debouncedInputValue
        ) ?
          data.response
          : []
      }
      value={value}
      inputValue={
        inputValue ||
        (!inputValue &&
          value &&
          !Array.isArray(value) &&
          value.label) ||
        ""
      }
      renderInput={(params) => <TextField {...params} label={label} />}
      renderValue={(value: Value | readonly Value[], getItemProps) => {
        if (multiSelect) {
          const valArray = value as Value[];
          if (valArray.length === 0) return null;
          return valArray.map((option, index) => (
            <InfoChip option={option} key={index} getItemProps={getItemProps} index={index} />
          ));
        }
        return (value as Value).value ? <InfoLink link={(value as Value).value} /> : null;
      }}
      onChange={(_e, newValue) => onSave(newValue as any)}
      onInputChange={(e, newValue) => {
        // Gets set when user starts typing
        e && e.type === "change" && setInputValue(newValue);
        // Clears input when user selects a value (inputValue becomes value, which gets displayed in the field)
        // or when a user clicks outside of the box without selecting a value
        e && (e.type === "click" || e.type === "blur") && setInputValue("");
      }}
      noOptionsText={!inputValue ? "Start typing to search" : "No results found"}
      loading={
        isFetching ||
        isLoading ||
        debouncedInputValue !== inputValue
      }
      loadingText={
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="end"
        >
          Loading... <CircularProgress size={18} />
        </Stack>
      }
      renderOption={(props, option) => (
        <li {...props} key={option.value} style={{ flexWrap: "wrap" }}>
          {option.categoryLabel && option.categoryContent && (
            <Typography
              component="div"
              sx={{ width: "100%", fontSize: "0.8rem" }}
              color="neutral.contrastText"
            >
              <Typography
                component="span"
                sx={{ fontWeight: "600", fontSize: "inherit" }}
              >
                {option.categoryLabel}
              </Typography>
              : {option.categoryContent}
            </Typography>
          )}
          {option.label}
          {option.extraContent && option.extraLabel && (
            <Typography
              component="div"
              sx={{ width: "100%", fontSize: "0.8rem" }}
              color="neutral.contrastText"
            >
              <Typography
                component="span"
                sx={{ fontWeight: "600", fontSize: "inherit" }}
              >
                {option.extraLabel}
              </Typography>
              : {option.extraContent}
            </Typography>
          )}
          {option.id && option.idLabel && (
            <Typography
              component="div"
              sx={{ width: "100%", fontSize: "0.8rem" }}
              color="neutral.contrastText"
            >
              <Typography
                component="span"
                sx={{ fontWeight: "600", fontSize: "inherit" }}
              >
                {option.idLabel}
              </Typography>
              : {option.id}
            </Typography>
          )}
        </li>
      )}
      forcePopupIcon
      isOptionEqualToValue={(option, value) => option.value === value.value}
      /*
        * For freesolo, we can either choose autoSelect or clearOnBlur, depends on the behaviour we want.
        * AutoSelect just uses the value as typed, clearOnBlur forces the user to make a conscious selection
        * For autoSelect, we could remove most of the filterOptions logic and the extra check in onChange.
        */
      clearOnBlur
      disabled={disabled}
    />
  );
};

function InfoLink({link, chip}: {
  link: string;
  chip?: boolean;
}) {
  return (
    <InputAdornment
      position="start"
      sx={{ ml: chip ? 1.5 : 0.5, mr: chip ? -0.75 : 0.25, zIndex: 1 }}
    >
      <Tooltip title="Open in new tab on source website">
        <a
          href={link}
          target="_blank"
          style={{ lineHeight: 0 }}
          rel="noreferrer"
        >
          <LaunchIcon
            color="primary"
            sx={{ fontSize: 16, "&:hover": { color: "primary.dark" } }}
          />
        </a>
      </Tooltip>
    </InputAdornment>
  );
};

function InfoChip({option, getItemProps, index}: {
  option: Value;
  getItemProps: any;
  index: number;
}) {
  const {key, ...itemProps} = getItemProps({ index });

  return (
    <Chip
      key={key} // Pass key directly
      {...itemProps} // Spread the rest of the props
      label={option.label}
      size="medium"
      icon={
        (option.value && option.value.startsWith("http")) ?
          <InfoLink
            link={option.value}
            chip={true}
          />
        : undefined
      }
    />
  );
};
const AutocompleteAPIField = ({
  field,
  groupName,
  groupIndex,
  inputValue,
  setInputValue,
  debouncedInputValue,
  data,
  isLoading,
  isFetching,
}: AutocompleteAPIFieldProps) => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation("metadata");
  const formDisabled = useAppSelector(getFormDisabled);
  const fieldValue = useAppSelector(getField(field.name, groupName, groupIndex));
  const status = getFieldStatus(fieldValue, field);
  const apiValue = (
    Array.isArray(field.options) ?
    fieldValue.multiApiValue
      : field.options) as TypeaheadAPI;

  return (
    <Stack direction="row" alignItems="start" sx={{ flex: 1 }}>
      <Autocomplete
        multiple={field.multiselect}
        fullWidth
        includeInputInList
        id={field.name}
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
        value={fieldValue.value || (field.multiselect ? [] : null)}
        inputValue={
          inputValue ||
          (!inputValue &&
            fieldValue.value &&
            !Array.isArray(fieldValue.value) &&
            lookupLanguageString(fieldValue.value.label, i18n.language)) ||
          ""
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={`${lookupLanguageString(field.label, i18n.language)}${field.required ? " *" : ""
              }`}
            error={status === "error" && fieldValue.touched}
            helperText={status === "error" && fieldValue.touched && t("incorrect")}
            placeholder={lookupLanguageString(field.placeholder, i18n.language)}
            InputProps={{
              ...params.InputProps,
              startAdornment:
                (
                  !field.multiselect &&
                  fieldValue.value &&
                  !Array.isArray(fieldValue.value) &&
                  fieldValue.value.value &&
                  fieldValue.value.value.startsWith("http")
                ) ?
                  <InfoLink link={fieldValue.value.value} apiValue={apiValue} />
                  : params.InputProps.startAdornment,
            }}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <InfoChip
              key={index}
              option={option}
              apiValue={apiValue}
              getTagProps={getTagProps}
              index={index}
            />
          ))
        }
        onChange={(_e, newValue, reason) => {
          // Gets set when user selects a value from the list
          // Make sure a mandatory value cannot get erased from a multiselect
          const saveValues = (reason === "clear" ||
            reason === "removeOption") &&
            Array.isArray(fieldValue.value) &&
            Array.isArray(newValue) && [
              ...fieldValue.value.filter((v: OptionsType) => v.mandatory),
              ...newValue.filter((v) => !v.hasOwnProperty("mandatory")),
            ];

          // In case freesolo is enabled and value selected using 'Enter', it's a string.
          // So we need to convert that string to an OptionsType
          const setValue =
            // check if it's a multiselect field with a freetext input and value is selected using enter
            (
              Array.isArray(newValue) &&
              field.allowFreeText &&
              typeof newValue[newValue.length - 1] === "string"
            ) ?
              [
                ...newValue.slice(0, -1),
                {
                  value: newValue[newValue.length - 1],
                  freetext: true,
                  label: newValue[newValue.length - 1],
                },
              ]
              // the same for non-multiselect
              : typeof newValue === "string" ?
                { label: newValue, value: newValue, freetext: true }
                // otherwise just return the new value
                : newValue;

          // Set the field
          dispatch(
            setField({
              field: field,
              value: (saveValues || setValue) as OptionsType | OptionsType[],
              ...(groupName !== undefined && { groupName: groupName }),
              ...(groupIndex !== undefined && { groupIndex: groupIndex }),
            }),
          );
        }}
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
            {t("loading")} <CircularProgress size={18} />
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
                  {t(option.categoryLabel)}
                </Typography>
                : {option.categoryContent}
              </Typography>
            )}
            {lookupLanguageString(option.label, i18n.language)}
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
                  {t(option.extraLabel)}
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
                  {t(option.idLabel)}
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
        disabled={formDisabled}
      />
    </Stack>
  );
};
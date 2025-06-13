export const ApiField = memo(({ field, groupName, groupIndex, sx }: SingleFieldProps) => {
  // Switch to determine which field type to render
  const getField = () => {
    const commonProps = {
      field,
      groupName,
      groupIndex,
    };

    switch (field.type) {
      case "geonames":
        return <GeonamesField {...(commonProps as CommonProps<AutocompleteFieldType>)} />;
      case "elsst":
      case "narcis":
      case "dansCollections":
      case "gettyAat":
        return <DatastationsField {...(commonProps as CommonProps<AutocompleteFieldType>)} />;
      case "wikidata":
        return <WikidataField {...(commonProps as CommonProps<AutocompleteFieldType>)} />;
      default:
        return null;
    }
  };

  return (
    <Grid xs={12}>
      {getField()}
    </Grid>
  );
});

const WikidataField = ({ field, groupName, groupIndex }: AutocompleteFieldProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const debouncedInputValue = useDebounce(inputValue, 500)[0];
  // Fetch data on input change
  const { data, isFetching, isLoading } =
    useFetchWikidataQuery<QueryReturnType>(debouncedInputValue, {
      skip: debouncedInputValue === "",
    });

  return (
    <AutocompleteAPIField
      field={field}
      groupName={groupName}
      groupIndex={groupIndex}
      inputValue={inputValue}
      setInputValue={setInputValue}
      debouncedInputValue={debouncedInputValue}
      data={data}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
};

const GeonamesField = ({ field, groupName, groupIndex }: AutocompleteFieldProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const debouncedInputValue = useDebounce(inputValue, 500)[0];
  // Fetch data on input change
  const { data, isFetching, isLoading } =
    useFetchGeonamesFreeTextQuery<QueryReturnType>(debouncedInputValue, {
      skip: debouncedInputValue === "",
    });

  return (
    <AutocompleteAPIField
      field={field}
      groupName={groupName}
      groupIndex={groupIndex}
      inputValue={inputValue}
      setInputValue={setInputValue}
      debouncedInputValue={debouncedInputValue}
      data={data}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
};

const DatastationsField = ({ field, groupName, groupIndex }: AutocompleteFieldProps) => {
  const { i18n } = useTranslation();
  const [inputValue, setInputValue] = useState<string>("");
  const debouncedInputValue = useDebounce(inputValue, 500)[0];
  // Fetch data on input change
  const { data, isFetching, isLoading } =
    useFetchDatastationsTermQuery<QueryReturnType>(
      {
        vocabulary: field.options,
        lang: i18n.language,
        query: debouncedInputValue,
      },
      { skip: debouncedInputValue === "" },
    );

  return (
    <AutocompleteAPIField
      field={field}
      groupName={groupName}
      groupIndex={groupIndex}
      inputValue={inputValue}
      setInputValue={setInputValue}
      debouncedInputValue={debouncedInputValue}
      data={data}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
};
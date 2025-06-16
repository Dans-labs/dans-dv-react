import { getFields, setField, type KeywordsFormState, type KeywordSource, type Keyword } from "./slice";
import type { TypedUseSelectorHook } from "react-redux";
import { useDebounce } from "use-debounce";
import { useState } from "react";
import { useFetchDatastationsTermQuery } from "./api/datastationsVocabs";
import { useFetchGeonamesFreeTextQuery } from "./api/geonames";
import { useFetchWikidataQuery } from "./api/wikidata";
import { AutocompleteAPIField } from "@dans-dv/inputs";
import Box from "@mui/material/Box";
import { TabHeader, SubHeader } from "@dans-dv/layout";
import { Submit, useSubmitDataMutation } from "@dans-dv/submit";
import { useApiToken } from "@dans-dv/wrapper";

type AppDispatch = (action: any) => any;
export type RootState = {keywords: KeywordsFormState};

type DatastationTypes = "elsst" | "narcis" | "dansCollections" | "gettyAat";

const datastationConfigs: DatastationTypes[] = ["elsst", "narcis", "dansCollections", "gettyAat"];

export function KeywordFields({ config, useAppDispatch, useAppSelector }: {
  useAppDispatch: () => AppDispatch;
  useAppSelector: TypedUseSelectorHook<RootState>;
  config: {
    wikidata?: boolean;
    geonames?: boolean;
    elsst?: boolean;
    narcis?: boolean;
    dansCollections?: boolean;
    gettyAat?: boolean;
  };
}) {
  const dispatch = useAppDispatch();
  const keywords = useAppSelector(getFields());
  const [ submitData, { isLoading: submitLoading, isSuccess: submitSuccess, isError: submitError, error: submitErrorMessage } ] = useSubmitDataMutation();
  const { apiToken, doi } = useApiToken();

  const onSave = (field: KeywordSource, data: Keyword[] ) => {
    dispatch(setField({
      field: field,
      value: data as Keyword[],
    }));
  };

  return (
    <Box>
      <TabHeader
        title="Keywords"
        subtitle="Add keywords from different sources to your dataset. Keywords can be used to find datasets in the Dataverse search engine."
      />
      {config.wikidata && (
        <WikidataField 
          onSave={(data) => onSave("wikidata", data)} 
          value={keywords.wikidata} 
        />
      )}
      {config.geonames && (
        <GeonamesField 
          onSave={(data) => onSave("geonames", data)} 
          value={keywords.geonames} 
        />
      )}
      {datastationConfigs.map((item) =>
        config[item] ? (
          <DatastationsField
            key={item}
            onSave={(data) => onSave(item, data)}
            value={keywords[item]}
            type={item}
          />
        ) : null
      )}

      <Submit 
        // disabled={!isValid || !hasData} 
        isLoading={submitLoading} 
        // isError={!isUninitialized && submitError} 
        isSuccess={submitSuccess} 
        error={submitErrorMessage as FetchBaseQueryError}
        // onClick={() => submitData({ keywords: keywords, doi: doi, apiToken: apiToken })}
      />

    </Box>
  );
};

function WikidataField({ onSave, value }: { 
  onSave: (data: Keyword[]) => void;
  value: Keyword[];
}) {
  const [inputValue, setInputValue] = useState<string>("");
  const debouncedInputValue = useDebounce(inputValue, 500)[0];
  // Fetch data on input change
  const { data, isFetching, isLoading } =
    useFetchWikidataQuery(debouncedInputValue, {
      skip: debouncedInputValue === "",
    });

  return (
    <Box mb={4}>
      <SubHeader 
        title="Wikidata"
        subtitle="Wikidata acts as a central storage for the structured data of Wikimedia projects like Wikipedia, Wikivoyage, Wiktionary."
      />
      <AutocompleteAPIField
        inputValue={inputValue}
        setInputValue={setInputValue}
        debouncedInputValue={debouncedInputValue}
        data={data}
        isLoading={isLoading}
        isFetching={isFetching}
        multiSelect
        label="Wikidata keywords"
        onSave={onSave}
        value={value}
      />
    </Box>
  );
};

function GeonamesField({ onSave, value }: { 
  onSave: (data: Keyword[]) => void;
  value: Keyword[];
}) {
  const [inputValue, setInputValue] = useState<string>("");
  const debouncedInputValue = useDebounce(inputValue, 500)[0];
  // Fetch data on input change
  const { data, isFetching, isLoading } =
    useFetchGeonamesFreeTextQuery(debouncedInputValue, {
      skip: debouncedInputValue === "",
    });

  return (
    <Box mb={4}>
      <SubHeader 
        title="Geonames"
        subtitle=""
      />
      <AutocompleteAPIField
        inputValue={inputValue}
        setInputValue={setInputValue}
        debouncedInputValue={debouncedInputValue}
        data={data}
        isLoading={isLoading}
        isFetching={isFetching}
        label="Geonames locations"
        onSave={onSave}
        value={value}
      />
    </Box>
  );
};

function DatastationsField({ type, onSave, value }: { 
  type: DatastationTypes;
  onSave: (data: Keyword[]) => void;
  value: Keyword[];
}) {
  const [inputValue, setInputValue] = useState<string>("");
  const debouncedInputValue = useDebounce(inputValue, 500)[0];
  // Fetch data on input change
  const { data, isFetching, isLoading } =
    useFetchDatastationsTermQuery(
      {
        vocabulary: type,
        query: debouncedInputValue,
      },
      { skip: debouncedInputValue === "" },
    );

  const label = 
    type === "elsst" ? "ELSST" :
    type === "narcis" ? "NARCIS" :
    type === "dansCollections" ? "DANS Collections" :
    type === "gettyAat" ? "Getty AAT" :
    "";

  return (
    <Box mb={4}>
      <SubHeader 
        title={label}
        subtitle={
          type === "elsst" ? "ELSST is the European Language Social Science Thesaurus, a controlled vocabulary for social science research." :
          type === "narcis" ? "NARCIS is the Dutch national portal for research information, providing access to datasets and publications." :
          type === "dansCollections" ? "DANS Collections provides access to datasets and publications from DANS, the Dutch national centre of expertise in digital archiving." :
          type === "gettyAat" ? "Getty AAT (Art & Architecture Thesaurus) is a structured vocabulary for art and architecture." :
          ""
        }
      />
      <AutocompleteAPIField
        inputValue={inputValue}
        setInputValue={setInputValue}
        debouncedInputValue={debouncedInputValue}
        data={data}
        isLoading={isLoading}
        isFetching={isFetching}
        multiSelect
        label={label}
        onSave={onSave}
        value={value}
      />
    </Box>
  );
};
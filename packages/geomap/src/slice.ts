import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./";

export type Keyword = {
  label: string;
  value: string;
}

export type KeywordsFormState = {
  wikidata: Keyword[];
  gettyAat: Keyword[];
  geonames: Keyword[];
  elsst: Keyword[];
  narcis: Keyword[];
  dansCollections: Keyword[];
};

export type KeywordSource = keyof KeywordsFormState;

const initialState: KeywordsFormState = {
  wikidata: [],
  gettyAat: [],
  geonames: [],
  elsst: [],
  narcis: [],
  dansCollections: [],
};

export const geomapSlice = createSlice({
  name: "geomap",
  initialState,
  reducers: {
    setField<K extends keyof KeywordsFormState>(
      state: KeywordsFormState,
      action: PayloadAction<{ field: K; value: KeywordsFormState[K] }>
    ) {
      const { field, value } = action.payload;
      state[field] = value;
    },
  },
});

export const { setField } = geomapSlice.actions;

export const getField = <K extends keyof KeywordsFormState>(field: K) =>
  (state: RootState) => state.keywords[field];

export const getFields = () => (state: RootState) => state.keywords;

export default geomapSlice.reducer;
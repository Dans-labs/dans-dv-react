import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./";

export type SWHFormState = {
  repository_url: string;
  software_author: string[];
  software_name: string;
  software_description: string;
};

const initialState: SWHFormState = {
  repository_url: '',
  software_author: [],
  software_name: '',
  software_description: '',
};

export const swhSlice = createSlice({
  name: "swh",
  initialState,
  reducers: {
    setField<K extends keyof SWHFormState>(
    state: SWHFormState,
    action: PayloadAction<{ field: K; value: SWHFormState[K] }>
  ) {
    const { field, value } = action.payload;
    state[field] = value;
  },
    setFieldArray<K extends keyof SWHFormState>(
      state: SWHFormState,
      action: PayloadAction<{
        field: K;
        index: number;
        value: SWHFormState[K];
      }>
    ) {
      const { field, index, value } = action.payload;
      if (Array.isArray(state[field])) {
        (state[field] as any[])[index] = value;
      }
    },
    resetValues(state: SWHFormState) {
      // resets all fields except for url
      state.software_author = [];
      state.software_name = '';
      state.software_description = '';
    },
  },
});

export const { setField, setFieldArray, resetValues } = swhSlice.actions;

export const getField = <K extends keyof SWHFormState>(field: K) =>
  (state: RootState) => state.swh[field];

export default swhSlice.reducer;
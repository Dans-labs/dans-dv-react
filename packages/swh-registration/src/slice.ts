import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./";

export type SWHFormState = {
  url: string;
  author: string;
  name: string;
  description: string;
};

const initialState: SWHFormState = {
  url: '',
  author: '',
  name: '',
  description: '',
};

export const swhSlice = createSlice({
  name: "swh",
  initialState,
  reducers: {
    setField<K extends keyof SWHFormState>(
      state: SWHFormState,
      action: PayloadAction<{ field: K; value: SWHFormState[K] }>
    ) {
      state[action.payload.field] = action.payload.value;
    },
  },
});

export const { setField } = swhSlice.actions;

export const getField = <K extends keyof SWHFormState>(field: K) =>
  (state: RootState) => state.swh[field];

export default swhSlice.reducer;
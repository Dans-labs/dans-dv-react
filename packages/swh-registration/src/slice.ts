import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@dans-dv/selector";

type SWHFormState = {
  repoUrl: string;
  author: string;
};

const initialState: SWHFormState = {
  repoUrl: '',
  author: '',
};

export const swhSlice = createSlice({
  name: "swh",
  initialState,
  reducers: {
    setField<K extends keyof SWHFormState>(
      state,
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
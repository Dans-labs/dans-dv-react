import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import { swhReducer, codemetaApi } from "@dans-dv/swh-registration";
import { submitApi } from "@dans-dv/submit";
import { dansFormatsApi, fileReducer } from "@dans-dv/file-upload";

export const store = configureStore({
  reducer: {
    swh: swhReducer,
    files: fileReducer,
    [codemetaApi.reducerPath]: codemetaApi.reducer,
    [submitApi.reducerPath]: submitApi.reducer,
    [dansFormatsApi.reducerPath]: dansFormatsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(codemetaApi.middleware)
      .concat(submitApi.middleware)
      .concat(dansFormatsApi.middleware)
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

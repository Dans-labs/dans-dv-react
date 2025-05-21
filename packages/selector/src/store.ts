import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import { swhReducer } from "@dans-dv/swh-registration";

export const store = configureStore({
  reducer: {
    swh: swhReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

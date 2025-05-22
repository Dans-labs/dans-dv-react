import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./";
import { SelectedFile, ReduxFileActions } from "./FileUpload";

export type FileFormState = [];

const initialState: SelectedFile[] = [];

export const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    addFiles: (state, action: PayloadAction<SelectedFile[]>) => {
      state.push(...action.payload);
    },
    removeFile: (state, action: PayloadAction<SelectedFile>) => {
      return state.filter(
        (file: SelectedFile) => file.name !== action.payload.name,
      );
    },
    queueFiles: (state) => {
      // set all files to queued
      state.forEach((file: SelectedFile) => {
        file.status = "queued";
        file.progress = 0;
      });
    },
    setFileMeta: (state, action: PayloadAction<ReduxFileActions>) => {
      console.log(action)
      // set metadata for this file: restricted status, role, processing, validity etc
      const file = state.find(
        (file: SelectedFile) => file.name === action.payload.name,
      );
      if (file) {
        file[action.payload.type] = action.payload.value;
      }
    },
    resetFiles: () => initialState,
  },
});

export const { addFiles, removeFile, setFileMeta, resetFiles, queueFiles } = filesSlice.actions;

// Select values from state
export const getFiles = (state: RootState) => state.files;
export const getSingleFile = (name: string) => (state: RootState) => state.files.find(file => file.name === name);

export default filesSlice.reducer;

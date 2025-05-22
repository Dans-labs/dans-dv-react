import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../redux/store";
import { SelectedFile, ReduxFileActions } from "../../types/Files";

export type FileFormState = [];

const initialState: SelectedFile[] = [];

export const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    // keep track of file selection
    addFiles: (state, action: PayloadAction<SelectedFile[]>) => {
      state.push(...action.payload);
    },
    removeFile: (state, action: PayloadAction<SelectedFile>) => {
      return state.filter(
        (file: SelectedFile) => file.id !== action.payload.id,
      );
    },
    setFileMeta: (state, action: PayloadAction<ReduxFileActions>) => {
      // set extra metadata for this file: restricted status, role, processing, validity
      const file = state.find(
        (file: SelectedFile) => file.id === action.payload.id,
      );
      if (file) {
        file[action.payload.type] = action.payload.value;
      }
    },
    resetFiles: () => initialState,
    setFilesSubmitStatus: (
      state,
      action: PayloadAction<ReduxFileSubmitActions>,
    ) => {
      const { id, progress, status } = action.payload;
      const file = state.submittedFiles.find(
        (file: SubmittedFile) => file.id === id,
      );
      if (file) {
        // file already in state, let's update it
        file.progress = progress ? progress : file.progress;
        file.status = status ? status : file.status;
      } else {
        // otherwise add it
        state.submittedFiles.push({
          id: id,
          progress: progress as number,
          status: status as SubmitStatus,
        });
      }
    },
  },
});

export const { addFiles, removeFile, setFileMeta, resetFiles, setFilesSubmitStatus } =
  filesSlice.actions;

// Select values from state
export const getFiles = (state: RootState) => state.files as SelectedFile[];
export const getSingleFileSubmitStatus = (id: string) => (state: RootState) =>
  state.submit.submittedFiles.find((file: SubmittedFile) => file.id === id);
export const getFilesSubmitStatus = (state: RootState) =>
  state.submit.submittedFiles;

export default filesSlice.reducer;

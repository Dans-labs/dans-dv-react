import FileTable from "./FileTable";
import FileUpload from "./FileUpload";
import type { TypedUseSelectorHook } from "react-redux";
import type { FileFormState } from "./slice";

export type RootState = {swh: FileFormState};
export type AppDispatch = () => (action: any) => any;
export type AppSelector = TypedUseSelectorHook<RootState>;
export type ReduxProps = {
  useAppDispatch: AppDispatch;
  useAppSelector: AppSelector;
}

export default function Files(props: ReduxProps) {
  return (
    <>
      <FileUpload {...props} />
      <FileTable {...props} />
    </>
  );
}
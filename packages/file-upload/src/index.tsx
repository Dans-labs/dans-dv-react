import { useEffect } from "react";
import FileTable from "./FileTable";
import FileUpload, { type SelectedFile } from "./FileUpload";
import type { TypedUseSelectorHook } from "react-redux";
import { getFiles, queueFiles } from "./slice";
import Button from "@mui/material/Button";
import { uploadFile } from "./tus";
import { useApiToken } from "@dans-dv/wrapper";
import { TabHeader, BoxWrap } from "@dans-dv/layout";
import { useSubmitDataMutation } from "@dans-dv/submit";
import Typography from "@mui/material/Typography";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import ImageIcon from '@mui/icons-material/Image';

export type RootState = {files: SelectedFile[]};
export type AppDispatch = () => (action: any) => any;
export type AppSelector = TypedUseSelectorHook<RootState>;
export type ReduxProps = {
  useAppDispatch: AppDispatch;
  useAppSelector: AppSelector;
}

export default function Files(props: ReduxProps) {
  const dispatch = props.useAppDispatch();
  const selectedFiles = props.useAppSelector(getFiles);
  const [ submitData, { isLoading: submitLoading } ] = useSubmitDataMutation();
  const { apiToken, doi } = useApiToken();

  return (
    <BoxWrap width={50}>
      <TabHeader
        title="Upload and process files"
        subtitle="Add (very large) files to your dataset, add additional metadata per file, and select processing options."
      />
      <Feature
        title="Currently supported processing options"
        items={[
          { 
            title: "Automatically create an AI generated transcription in txt format.",
            files: ["video", "audio"],
          },
          { 
            title: "Generate thumbnails",
            files: ["video", "images"],
          },
        ]}
      />
      <FileUpload {...props} />
      <FileTable {...props} />
      <Button 
        variant="contained" 
        color="primary" 
        size="large" 
        onClick={() => 
          submitData({
            files: selectedFiles,
            apiToken: apiToken,
            id: doi,
          }).then(() => dispatch(queueFiles()))
        } 
        disabled={selectedFiles.length === 0 || selectedFiles.some((file) => file.status === "queued" || submitLoading)}
      >
        Upload
      </Button>
      <FileUploader {...props} />
    </BoxWrap>
  );
}

const maxConcurrentUploads = 3;

function FileUploader({useAppSelector, useAppDispatch}: ReduxProps) {
  // Component that manages file upload queue.
  // Check files that have status queued, and start uploading when a spot becomes available in the queue.
  const selectedFiles = useAppSelector(getFiles);
  const dispatch = useAppDispatch();
  const { apiToken, doi } = useApiToken();

  useEffect(() => {
    const currentlyUploading = selectedFiles.filter(
      (file) => file.status === "submitting",
    );
    if (currentlyUploading.length < maxConcurrentUploads) {
      // add first file of selectedFiles that is not currently uploading to the active uploads
      selectedFiles.find((file) => {
        console.log(file)
        // only call the upload function if file is queued
        return file?.status === "queued" && apiToken && doi && uploadFile(file, dispatch, apiToken, doi);
      });
    }
  }, [selectedFiles]);

  return null;
};

function Feature({ title, items }: { title: string; items: { title: string; files: string[] }[] }) {
  return (
    <>
      <Typography variant="h6" sx={{ fontSize: "1rem" }}>
        {title}
      </Typography>
      <List dense={true}>
        {items.map((item, index) => (
          <ListItem key={index} disableGutters>
            <ListItemIcon>
              { item.files.map((fileType) => (
                fileType === "video" ? 
                <VideocamIcon key={fileType} /> :
                fileType === "audio" ?
                <AudiotrackIcon key={fileType} /> :
                fileType === "images" || fileType === "image" ?
                <ImageIcon key={fileType} /> : 
                null
              )) }
            </ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
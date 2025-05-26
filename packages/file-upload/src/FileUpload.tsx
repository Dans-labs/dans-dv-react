import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import CloseIcon from "@mui/icons-material/Close";
import Collapse from "@mui/material/Collapse";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import IconButton from "@mui/material/IconButton";
import { getFiles, addFiles } from "./slice";
import { useFetchSimpleListQuery } from "./api/dansFormats";
import type { ReduxProps } from "./";
import type { FileRejection } from "react-dropzone";

const maxFileSize = 1000000 * 1024 * 1024; // 10 GB

export type FileActions = {
  label: string;
  value: string;
  for?: string[];
}
export type FileLocation = "local" | "online";
export type SelectedFile = {
  name: string;
  size: number;
  mimeType: string;
  location: FileLocation;
  url: string;
  lastModified: number;
  private?: boolean;
  role?: FileActions;
  process?: FileActions[];
  valid?: boolean;
  embargo?: string;
  submitProgress?: number;
  submitSuccess?: boolean;
  submitError?: boolean;
  submittedFile?: boolean;
  state?: string;
  status?: string;
  progress?: number;
};

const FileUpload = ({ useAppDispatch, useAppSelector }: ReduxProps) => {
  const dispatch = useAppDispatch();
  const currentFiles = useAppSelector(getFiles);
  const { data } = useFetchSimpleListQuery(null);

  // Validate added files, needs to be synchronous, so no API calls possible here
  const fileValidator = (file: File) => {
    if (!file.name) return null;

    const forbiddenCharacters = /[\/:*?"<>|;#]/;
    if (forbiddenCharacters.test(file.name)) {
      return {
        code: "file-invalid",
        message: "File name contains invalid characters",
      };
    }

    // No files over the file size limit set in formConfig
    if ( file.size > maxFileSize ) {
      return {
        code: "file-too-large",
        message: `File size too large: ${ (maxFileSize / 1073741824).toFixed(2)}`,
      };
    }

    if (!file.size || file.size === 0) {
      return {
        code: "file-invalid",
        message: "File is empty",
      };
    }

    // No duplicate files
    const extensionIndex = file.name.lastIndexOf(".");
    const baseName = file.name.slice(0, extensionIndex);
    const extension = file.name.slice(extensionIndex);
    if (
      currentFiles.find((f) => {
        const extensionIndexCurrent = f.name.lastIndexOf(".");
        const baseNameCurrent = f.name.slice(0, extensionIndexCurrent);
        const extensionCurrent = f.name.slice(extensionIndexCurrent);
        return (
          baseNameCurrent.indexOf(baseName) !== -1 &&
          extension === extensionCurrent &&
          f.size === file.size
        );
      })
    ) {
      return {
        code: "file-exists",
        message: `File ${file.name} already added`,
      };
    }

    // No files with these file names
    if (
      file.name.indexOf("__generated__form-metadata") !== -1 ||
      // oh smart specific. todo: move this all to form config.
      file.name.toLowerCase() === "oral history metadata private.txt" ||
      file.name.toLowerCase() === "oral history metadata public.txt"
    ) {
      return {
        code: "file-not-allowed",
        message: "File name not allowed",
      };
    }

    return null;
  };

  const onDrop = async (acceptedFiles: File[]) => {
    // Check if a file with the same name has been added; if so, rename to (1), (2), etc
    // Transform the file to a file blob URL so we can save it to the Redux store
    const serializedFiles = acceptedFiles.map((file) => {
      const fileExists = currentFiles.find((f) => f.name === file.name);
      // Logic to rename files to the next sequential number
      let updatedFile = file.name;
      if (fileExists) {
        let sequentialNumber = 0;
        const fileExistsWithUpdatedName = (f: SelectedFile) =>
          f.name === updatedFile;
        while (currentFiles.find(fileExistsWithUpdatedName)) {
          sequentialNumber++;
          const extensionIndex = file.name.lastIndexOf(".");
          const baseName = file.name.slice(0, extensionIndex);
          const extension = file.name.slice(extensionIndex);
          updatedFile = `${baseName}(${sequentialNumber})${extension}`;
        }
      }

      const fileName = fileExists ? updatedFile : file.name;

      return {
        name: fileName,
        size: file.size,
        lastModified: file.lastModified,
        type: file.name.substring(file.name.lastIndexOf(".") + 1),
        mimeType: file.type,
        location: "local" as FileLocation,
        url: URL.createObjectURL(file),
        private: false,
      };
    });

    dispatch(addFiles(serializedFiles));
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      multiple: true,
      accept: {
        "application/octet-stream": data ? data.map((d) => `.${d}`) : [],
      },
      validator: fileValidator,
    });

  return (
    <>
      <Box
        sx={{
          border: "1px dashed #ccc",
          borderColor: "neutral.main",
          backgroundColor: isDragActive ? "primary.light" : "transparent",
        }}
        mb={2}
        p={3}
        {...getRootProps({ className: "dropzone" })}
      >
        {data ?
          <>
            <input {...getInputProps()} />
            <Typography
              color="neutral.contrastText"
              sx={{ textAlign: "center", cursor: "pointer" }}
            >
              {isDragActive ? "Drop file here" : "Click or drag file here"}
            </Typography>
          </>
        : <Typography
            color="neutral.contrastText"
            sx={{ textAlign: "center", cursor: "pointer" }}
          >
            Loading file types...
          </Typography>
        }
      </Box>
      {fileRejections.length > 0 && (
        <FileAlert
          files={fileRejections}
          color="error"
          title="File error"
        />
      )}
    </>
  );
};

// This alert show either rejected files, or warnings
const FileAlert = ({
  color,
  title,
  files,
}: {
  color: "warning" | "error";
  title: string;
  files: SelectedFile[] | readonly FileRejection[];
}) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapse in={open}>
      <Alert
        severity={color}
        sx={{ mb: 2 }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => setOpen(false)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        <AlertTitle>{title}</AlertTitle>
        <List dense={true}>
          {files.map((file, i) => (
            <ListItem key={i} disableGutters>
              <ListItemIcon>
                <InsertDriveFileIcon />
              </ListItemIcon>
              <ListItemText
                primary={(file as FileRejection).file?.name || (file as SelectedFile).name}
                secondary={
                  (file as FileRejection).errors &&
                  (file as FileRejection).errors.map(
                    (error, i) =>
                      `${error.message}${
                        i < (file as FileRejection).errors.length - 1 ? " | " : ""
                      }`,
                  )
                }
              />
            </ListItem>
          ))}
        </List>
      </Alert>
    </Collapse>
  );
};

export default FileUpload;

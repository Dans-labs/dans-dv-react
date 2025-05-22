import { useState, forwardRef, useMemo } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow, { TableRowProps } from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import ReplayCircleFilledIcon from "@mui/icons-material/ReplayCircleFilled";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Tooltip from "@mui/material/Tooltip";
import { getFiles, removeFile, setFileMeta } from "./slice";
import { fileProcessing, fileRoles } from "./utils/fileOptions";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { getSingleFileSubmitStatus, setFilesSubmitStatus } from "./slice";
import { useFetchGroupedListQuery } from "./api/dansFormats";
import type { ReduxProps, AppSelector, AppDispatch } from "./";

const FileTable = ({ useAppDispatch, useAppSelector }: ReduxProps) => {
  const selectedFiles = useAppSelector<SelectedFile[]>(getFiles);

  return selectedFiles.length !== 0 ?
      <TableContainer component={Paper} sx={{ overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ p: 1, width: 10 }} />
              <TableCell sx={{ p: 1 }}>File name</TableCell>
              <TableCell sx={{ p: 1 }}>Size</TableCell>
              <TableCell sx={{ p: 1 }}>Type</TableCell>
              <TableCell sx={{ p: 1, width: 10 }}>Private</TableCell>
              <TableCell sx={{ p: 1, width: 230 }}>Role</TableCell>
              <TableCell sx={{ p: 1, width: 230 }}>Processing</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedFiles.map((file) => (
              <FileTableRow key={file.name} file={file} useAppDispatch={useAppDispatch} useAppSelector={useAppSelector} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    : null;
};

const FileActionOptions = ({ file, type, useAppDispatch, useAppSelector }: {file: any; type: any; useAppDispatch: AppDispatch; useAppSelector: AppSelector}) => {
  const dispatch = useAppDispatch();
  const options = type === "process" ? fileProcessing : fileRoles;

  // Need to check the type of file and provide valid processing options
  const { data } = useFetchGroupedListQuery(null);

  return (
    <Autocomplete
      id={`${file.name}_${type}`}
      size="small"
      multiple={type === "process"}
      onChange={(_e, newValue) =>
        dispatch(
          setFileMeta({
            id: file.id,
            type: type,
            value: newValue,
          }),
        )
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={t(type === "process" ? "selectOptions" : "selectOption")}
          inputProps={{
            ...params.inputProps,
            "data-testid": `actions-${type}-${file.name}`,
          }}
        />
      )}
      options={options}
      value={file[type] || (type === "process" ? [] : null)}
      isOptionEqualToValue={(option, value) => option.value === value.value}
    />
  );
};

const FileTableRow = ({ file, useAppDispatch, useAppSelector }: {file: any; useAppDispatch: AppDispatch; useAppSelector: AppSelector}) => {
  const dispatch = useAppDispatch();
  const [toDelete, setToDelete] = useState<boolean>(false);
  const fileStatus = useAppSelector(getSingleFileSubmitStatus(file.id));

  return (
    <>
      <TableRow
        sx={{
          backgroundColor:
            file.valid === false ? "warning.light"
            : toDelete ? "neutral.light"
            : "",
        }}
      >
        <TableCell sx={{ p: 0, pl: 1, borderWidth: fileStatus ? 0 : 1 }}>
          {!(file.state && file.state === "generated") && 
            <IconButton
              color="primary"
              size="small"
              onClick={() =>
                (!file.submittedFile ?
                  dispatch(removeFile(file))
                : setToDelete(!toDelete))
              }
              data-testid={`delete-${file.name}`}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          }
        </TableCell>
        <TableCell
          sx={{
            p: 1,
            minWidth: 150,
            maxWidth: 200,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            borderWidth: fileStatus ? 0 : 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>

                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      fontSize: 11,
                      mr: 1,
                    }}
                    color="error"
                    onClick={() => dispatch(removeFile(file))}
                  >
                    {t(`confirmDelete`)}
                  </Button>

                {file.name}
          </Box>
        </TableCell>
        <TableCell sx={{ p: 1, borderWidth: fileStatus ? 0 : 1, opacity: file.state && file.state === "generated" ? 0.5 : 1 }}>
          {file.size ? `${(file.size / 1048576).toFixed(2)} MB` : "-"}
        </TableCell>
        <TableCell sx={{ p: 1, borderWidth: fileStatus ? 0 : 1 }}>
          
        </TableCell>
        <TableCell sx={{ p: 0, borderWidth: fileStatus ? 0 : 1 }}>
          <Checkbox
            checked={file.private}
            onChange={(e) =>
              dispatch(
                setFileMeta({
                  id: file.id,
                  type: "private",
                  value: e.target.checked,
                }),
              )
            }
            data-testid={`private-${file.name}`}
          />
        </TableCell>
        <TableCell
          sx={{ p: 1, minWidth: 150, borderWidth: fileStatus ? 0 : 1 }}
        >
          <FileActionOptions type="role" file={file} useAppDispatch={useAppDispatch} useAppSelector={useAppSelector} />
        </TableCell>
        <TableCell
          sx={{ p: 1, minWidth: 150, borderWidth: fileStatus ? 0 : 1 }}
        >
          <FileActionOptions type="process" file={file} useAppDispatch={useAppDispatch} useAppSelector={useAppSelector} />
        </TableCell>
      </TableRow>
      <TableRow>
        <UploadProgress file={file} key={`progress-${file.id}`} useAppDispatch={useAppDispatch} useAppSelector={useAppSelector} />
      </TableRow>
    </>
  );
};

const UploadProgress = ({ file, useAppDispatch, useAppSelector }: {file: any; useAppDispatch: AppDispatch; useAppSelector: AppSelector}) => {
  const dispatch = useAppDispatch();
  // We handle progress and manually retrying/restarting of file uploads here
  const fileStatus = useAppSelector(getSingleFileSubmitStatus(file.id));

  const handleSingleFileUpload = () => {
    dispatch(
      setFilesSubmitStatus({
        id: file.id,
        progress: 0,
        status: "queued",
      }),
    );
  };

  return (
    fileStatus ? (
      <TableCell
        sx={{
          paddingBottom: 0,
          paddingTop: 0,
        }}
        colSpan={8}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ width: "100%", mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={fileStatus.progress || 0}
              color={
                fileStatus.status === "success" ? "success"
                : fileStatus.status === "error" ?
                  "error"
                : "primary"
              }
              sx={{ borderRadius: 2 }}
            />
          </Box>
          <Box sx={{ minWidth: 35, textAlign: "right" }}>
            {(fileStatus.status === "submitting" ||
              fileStatus.status === "queued") && (
              <Typography variant="body2" color="text.secondary">{`${
                fileStatus.progress || 0
              }%`}</Typography>
            )}
            {fileStatus.status === "finalising" && (
              <Tooltip title="Finalising upload">
                <CircularProgress size={20} />
              </Tooltip>
            )}
            {fileStatus.status === "success" && (
              <Tooltip title="Uploaded successfully">
                <CheckCircleIcon color="success" />
              </Tooltip>
            )}
            {fileStatus.status === "error" && (
              <Stack direction="row" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Upload failed
                </Typography>
                <IconButton onClick={() => handleSingleFileUpload()}>
                  <Tooltip title="File upload failed. Click to retry">
                    <ReplayCircleFilledIcon color="error" />
                  </Tooltip>
                </IconButton>
              </Stack>
            )}
          </Box>
        </Box>
      </TableCell>
    ) : null
  );
};

export default FileTable;

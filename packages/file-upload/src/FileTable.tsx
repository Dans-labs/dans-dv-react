import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import ReplayCircleFilledIcon from "@mui/icons-material/ReplayCircleFilled";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Tooltip from "@mui/material/Tooltip";
import { getFiles, removeFile, setFileMeta } from "./slice";
import { fileProcessing, fileRoles } from "./utils/fileOptions";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useFetchGroupedListQuery } from "./api/dansFormats";
import type { ReduxProps, AppDispatch } from "./";
import type { SelectedFile } from "./FileUpload";
import { findFileGroup } from "./utils/fileHelpers";
import Typography from "@mui/material/Typography";

const FileTable = ({ useAppDispatch, useAppSelector }: ReduxProps) => {
  const selectedFiles = useAppSelector<SelectedFile[]>(getFiles);

  return selectedFiles.length !== 0 ?
    <Box mb={2}>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ p: 1, width: 10 }} />
              <TableCell sx={{ p: 1 }}>File name</TableCell>
              <TableCell sx={{ p: 1 }}>Size</TableCell>
              <TableCell sx={{ p: 1, width: 10 }}>Private</TableCell>
              <TableCell sx={{ p: 1, width: 230 }}>Role</TableCell>
              <TableCell sx={{ p: 1, width: 230 }}>Processing</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedFiles.map((file) => (
              <FileTableRow key={file.name} file={file} useAppDispatch={useAppDispatch} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    : null;
};

const FileActionOptions = ({ file, type, useAppDispatch }: {file: any; type: any; useAppDispatch: AppDispatch }) => {
  const dispatch = useAppDispatch();
  // Need to check the type of file and provide valid processing options
  const { data } = useFetchGroupedListQuery(null);
  
  const typeKey =
    file.name && data ? findFileGroup(file.name.split(".").pop(), data) : "";

  const options = type === "process" 
    ? fileProcessing.filter(o => o.for && typeKey && o.for.indexOf(typeKey) !== -1) 
    : fileRoles;

  return (
    options.length === 0 ? 
      "No options available"
    :
    <Autocomplete
      id={`${file.name}_${type}`}
      size="small"
      multiple={type === "process"}
      onChange={(_e, newValue) =>
        dispatch(
          setFileMeta({
            name: file.name,
            type: type,
            value: newValue,
          }),
        )
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={type === "process" ? "Select options" : "Select role"}
        />
      )}
      options={options}
      value={file[type] || (type === "process" ? [] : null)}
      isOptionEqualToValue={(option, value) => option.value === value.value}
    />
  );
};

const FileTableRow = ({ file, useAppDispatch }: {file: SelectedFile; useAppDispatch: AppDispatch}) => {
  const dispatch = useAppDispatch();

  // Handle progress and manually retrying/restarting of file uploads
  const handleSingleFileUpload = () => {
    dispatch(
      setFileMeta({
        name: file.name,
        type: "status",
        value: "queued",
      }),
    );
  };

  return (
    <>
      <TableRow sx={{ backgroundColor: file.valid === false ? "warning.light" : "" }}>
        <TableCell sx={{ p: 0, pl: 1 }}>
          {/* Actions/info: delete, retry, done, etc. */}

          {(file.status === "submitting" || file.status === "queued" || file.status === "finalising") && (
            <CircularProgress size={20} sx={{p: 0.6}} />
          )}
          {file.status === "success" && (
            <Tooltip title="Uploaded successfully">
              <CheckCircleIcon color="success" />
            </Tooltip>
          )}
          {file.status === "error" && (
            <IconButton onClick={() => handleSingleFileUpload()} size="small">
              <Tooltip title="File upload failed. Click to retry">
                <ReplayCircleFilledIcon color="error" fontSize="small" />
              </Tooltip>
            </IconButton>
          )}
          {!file.status &&
            <IconButton
              color="primary"
              size="small"
              onClick={() => dispatch(removeFile(file))}
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
          }}
        >
          {file.name}
        </TableCell>
        <TableCell sx={{ p: 1 }}>
          {file.size ? `${(file.size / 1048576).toFixed(2)} MB` : "-"}
        </TableCell>
        <TableCell sx={{ p: 0 }}>
          <Checkbox
            checked={file.private}
            onChange={(e) =>
              dispatch(
                setFileMeta({
                  name: file.name,
                  type: "private",
                  value: e.target.checked,
                }),
              )
            }
          />
        </TableCell>
        <TableCell sx={{ p: 1, minWidth: 150 }}>
          <FileActionOptions type="role" file={file} useAppDispatch={useAppDispatch} />
        </TableCell>
        <TableCell sx={{ p: 1, minWidth: 150 }}>
          <FileActionOptions type="process" file={file} useAppDispatch={useAppDispatch} />
        </TableCell>
      </TableRow>
      {file.status && 
        <TableRow>
          <UploadProgress file={file} key={`progress-${file.name}`} />
        </TableRow>
      }
    </>
  );
};

const UploadProgress = ({ file }: { file: SelectedFile }) => {
  console.log("UploadProgress", file);
  return (
    <TableCell
      colSpan={6}
    >
      <Box sx={{ width: "100%" }}>
        {file.status &&
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', textAlign: 'right', width: 200 }}>
              {file.status === 'submitting' && `${file?.progress || 0}% uploaded`}
              {file.status === 'error' && `Error uploading, please retry`}
              {file.status === 'success' && `Upload complete`}
              {file.status === 'queued' && `Waiting to upload`}
            </Typography>
            <LinearProgress
              sx={{ width: "100%", borderRadius: 1 }}
              variant="determinate"
              value={file?.progress || 0}
              color={
                file?.status === "success" 
                ? "success"
                : file?.status === "error" 
                ? "error"
                : file?.status === "queued" 
                ? "primary"
                : undefined
              }
            />
          </Stack>
        }
        {file.process && file.process.length > 0 && file.process.map(process => (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', textAlign: 'right', width: 200 }}>
              {process.label}
            </Typography>
            <LinearProgress
              sx={{ width: "100%", borderRadius: 1 }}
              variant="determinate"
              value={0}
              color="secondary"
            />              
          </Stack>
        ))}
      </Box>
    </TableCell>
  );
};

export default FileTable;

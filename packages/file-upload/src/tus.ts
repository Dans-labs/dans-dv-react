import * as tus from "tus-js-client";
import { setFileMeta } from "./slice";
import { SelectedFile } from "./FileUpload";

const manualError = async (
  fileName: string,
  error: any,
  dispatch: any,
) => {
  console.error("Error", error);
  dispatch(
    setFileMeta({
      name: fileName,
      type: "status",
      value: "error",
    }),
  );
};

// Create a new tus upload
export const uploadFile = async (file: SelectedFile, dispatch: any, apiToken: string, doi: string) => {
  // set file status to submitting, to add it to actual upload queue, while we create the blob
  dispatch(
    setFileMeta({
      name: file.name,
      type: "status",
      value: "submitting",
    }),
  );

  // convert file url to blob
  const fetchedFile = await fetch(file.url);

  if (!fetchedFile.ok) {
    dispatch(
      setFileMeta({
        name: file.name,
        type: "status",
        value: "error",
      }),
    );
    throw new Error(`Failed to fetch file: ${fetchedFile.statusText}`);
  }

  const fileBlob = await fetchedFile.blob();

  // TUS upload logic
  const upload = new tus.Upload(fileBlob, {
    endpoint: `${import.meta.env.VITE_PACKAGING_TARGET}/files`,
    // retry timeouts on error
    retryDelays: [1000, 5000, 10000],
    // optional metadata for the file
    metadata: {
      fileName: file.name,
    },
    headers: {
      "auth-env-name": import.meta.env.VITE_ENV_NAME,
      "assistant-config-name": import.meta.env.VITE_CONFIG_NAME,
      "targets-credentials": JSON.stringify({
        dataverse_api_key: apiToken,
        doi: doi,
      }),
    },
    removeFingerprintOnSuccess: true,
    onError: (error) => {
      console.log(file);
      manualError(file.name, error, dispatch);
    },
    onShouldRetry: (error, retryAttempt, _options) => {
      console.error("Error", error);
      console.log("Request", error.originalRequest);
      console.log("Response", error.originalResponse);
      console.log("Retry attempt", retryAttempt);

      var status = error.originalResponse ? error.originalResponse.getStatus() : 0;
      // Do not retry if the status is a 403.
      if (status === 403 || retryAttempt >= 2) {
        return false;
      }

      // For any other status code, we should retry.
      return true;
    },
    onProgress: (bytesUploaded, bytesTotal) => {
      var percentage = parseFloat(((bytesUploaded / bytesTotal) * 100).toFixed(0)) || 0;
      dispatch(
        setFileMeta({
          name: file.name,
          type: "progress",
          value: percentage,
        }),
      );
    },
    onSuccess: async () => {
      const tusId = upload.url?.split("/").pop();

      // Due to incomplete Python TUS implementation,
      // we do an extra api PATCH call to the server to signal succesful upload.
      // Response might take a while, so lets display a spinner that informs the user
      dispatch(
        setFileMeta({
          name: file.name,
          type: "status",
          value: "finalising",
        }),
      );

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_PACKAGING_TARGET
          }/inbox/files/${tusId}`,
          {
            method: "PATCH",
            headers: {
              "auth-env-name": import.meta.env.VITE_ENV_NAME,
              "assistant-config-name": import.meta.env.VITE_CONFIG_NAME,
              "targets-credentials": JSON.stringify({
                dataverse_api_key: apiToken,
                doi: doi,
              }),
            },
          },
        );
        // check if patch result is ok
        if (response.status === 200) {
          // set file status to success
          dispatch(
            setFileMeta({
              name: file.name,
              type: "submittedFile",
              value: true,
            }),
          );
          dispatch(
            setFileMeta({
              name: file.name,
              type: "status",
              value: "success",
            }),
          );
        } else {
          manualError(
            file.name,
            `PATCH call gave an invalid response ${response.status}`,
            dispatch
          );
        }
      } catch (error) {
        // on error, file must be set to failed, as server can't processed it properly
        manualError(
          file.name,
          "error dispatching PATCH call to inbox/files/{sessionID}/{tusID}",
          dispatch
        );
      }
    },
  });

  // Check if there are any previous uploads to continue.
  upload.findPreviousUploads().then(function (previousUploads) {
    // Found previous uploads so we select the first one.
    if (previousUploads.length) {
      upload.resumeFromPreviousUpload(previousUploads[0]);
    }

    // Start the upload
    upload.start();
  });
};

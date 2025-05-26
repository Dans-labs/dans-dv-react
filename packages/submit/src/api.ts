import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export function getUserFriendlyError(error: FetchBaseQueryError | unknown): string {
  if (
    typeof error === "object" &&
    error != null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    const status = error.status;

    switch (status) {
      case 400:
        return "The submitted data is invalid. Please check your input.";
      case 401:
      case 403:
        return "You are not authorized to perform this action. Please check your access token.";
      case 404:
        return "The submission service could not be reached. Please try again later.";
      case 500:
        return "The server encountered an error. Please try again in a few moments.";
      default:
        return `Unexpected error (${status}). Please try again.`;
    }
  }

  return "An unknown error occurred. Please check your internet connection or try again later.";
}

export const submitApi = createApi({
  reducerPath: "submitApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_PACKAGING_TARGET}`,
  }),
  endpoints: (build) => ({
    submitData: build.mutation({
      query: ({ data, apiToken, doi }) => {
        // format headers
        const headers = {
          "auth-env-name": import.meta.env.VITE_ENV_NAME,
          "assistant-config-name": import.meta.env.VITE_CONFIG_NAME,
          "targets-credentials": JSON.stringify(
            {
              dataverse_api_key: apiToken,
              doi: doi,
            }
          ),
        };

        // log for dev
        if(!import.meta.env.PROD) {
          console.log("Submit req headers:");
          console.log(headers);
          console.log("Submit metadata:");
          console.log(data);
        }

        const submitUrl = `dataset/SUBMIT`;

        return {
          url: `inbox/${submitUrl}`,
          method: "POST",
          headers: headers,
          body: data,
        };
      },
    }),
  }),
});

export const { useSubmitDataMutation } = submitApi;

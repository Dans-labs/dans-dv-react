import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

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

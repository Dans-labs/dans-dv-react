import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type GeonamesItem = {
  name: string;
  fcodeName: string;
  countryName?: string;
  geonameId: string;
  lat: string;
  lng: string;
}

type GeonamesResponse = {
  totalResultsCount: number;
  geonames: GeonamesItem[];
  ocean?: GeonamesItem;
}

export type PlaceOption = {
  label: string;
  value: string;
  coordinates?: [number, number]; // Only present for geonames
  id?: string;
};

export const geonamesApi = createApi({
  reducerPath: "geonames",
  baseQuery: fetchBaseQuery({ baseUrl: "https://secure.geonames.org/" }),
  endpoints: (build) => ({
    fetchGeonamesFreeText: build.query({
      query: (value) => ({
        url: `searchJSON?q=${value}&username=${
          import.meta.env.VITE_GEONAMES_API_KEY
        }`,
        headers: { Accept: "application/json" },
      }),
      transformResponse: (response: GeonamesResponse, _meta, arg) => {
        // Return an empty array when no results, which is what the Autocomplete field expects
        return response.totalResultsCount > 0 ?
            {
              arg: arg,
              response: response.geonames.map((item) => ({
                label: `${item.name}${
                  item.countryName ? `, ${item.countryName}` : ""
                }`,
                value: `https://www.geonames.org/${item.geonameId}`,
                coordinates: [parseFloat(item.lng), parseFloat(item.lat)],
                id: item.geonameId.toString(),
              })),
            }
          : [];
      },
    }),
    fetchPlaceReverseLookup: build.query({
      query: ({ lat, lng }) => ({
        url: `extendedFindNearby?lat=${lat}&lng=${lng}&radius=1&maxRows=100&username=${
          import.meta.env.VITE_GEONAMES_API_KEY
        }`,
        headers: { Accept: "application/json" },
      }),
      transformResponse: (response: GeonamesResponse, _meta, arg) => {
        // Return an empty array when no results, which is what the Autocomplete field expects
        return (
          response.geonames?.length > 0 ?
            {
              arg: arg,
              response: response.geonames.map((item) => ({
                label: `${item.name}${
                  item.countryName ? `, ${item.countryName}` : ""
                }`,
                value: `https://www.geonames.org/${item.geonameId}`,
                coordinates: [parseFloat(item.lng), parseFloat(item.lat)],
                id: item.geonameId.toString(),
              })),
            }
          : response.ocean ?
            {
              arg: arg,
              response: [
                {
                  label: response.ocean.name,
                  value: `https://www.geonames.org/${response.ocean.geonameId}`,
                  id: response.ocean.geonameId,
                },
              ],
            }
          : []
        );
      },
    }),
  }),
});

export const {
  useFetchGeonamesFreeTextQuery,
  useFetchPlaceReverseLookupQuery,
} = geonamesApi;

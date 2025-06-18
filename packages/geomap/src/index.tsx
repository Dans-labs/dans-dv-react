import type { TypedUseSelectorHook } from "react-redux";
import { useApiToken } from "@dans-dv/wrapper";
import { TabHeader, BoxWrap } from "@dans-dv/layout";
import DrawMap from "./Map";
import { Submit, useSubmitDataMutation } from "@dans-dv/submit";
import { getFeatures, setFeatures, type GeomapState, type ExtendedMapFeature } from "./slice";

export type RootState = {geomap: GeomapState};
export type AppDispatch = (action: any) => any;
export type AppSelector = TypedUseSelectorHook<RootState>;
export type ReduxProps = {
  useAppDispatch: AppDispatch;
  useAppSelector: AppSelector;
}

export default function GeoData({ config, useAppDispatch, useAppSelector }: {
  useAppDispatch: () => AppDispatch;
  useAppSelector: TypedUseSelectorHook<RootState>;
  config: {
    geonames?: boolean;
    map?: boolean;
  }
}) {
  const [ submitData, { isLoading, isSuccess, isError } ] = useSubmitDataMutation();
  const { apiToken, doi } = useApiToken();
  const dispatch = useAppDispatch();
  const value = useAppSelector(getFeatures());

  const setFeaturesValue = (features: ExtendedMapFeature[]) => {
    dispatch(setFeatures(features));
  };

  return (
    <BoxWrap width={60}>
      <TabHeader
        title="Geospatial data"
        subtitle="Some explanation on how to use this tool."
      />
      { config.map && <DrawMap setValue={setFeaturesValue} value={value} /> }

      <Submit 
        disabled={value.length === 0 || isLoading}
        isLoading={isLoading}
        isError={isError}
        isSuccess={isSuccess}
        onClick={() => submitData({ data: value, doi: doi, apiToken: apiToken })}
      />

    </BoxWrap>
  );
}
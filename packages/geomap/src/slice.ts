import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./";
import type { Feature, Point, Polygon, LineString, Geometry } from "geojson";

export type OptionsType = {
  label: string;
  value: string;
};

export type MapFeatureType = Point | Polygon | LineString;
export interface ExtendedMapFeature<G extends Geometry = Geometry, P = any> extends Feature<G, P> {
  geonames?: OptionsType | undefined;
  originalCoordinates?: number[] | number[][] | number[][][];
  coordinateSystem?: CoordinateSystem;
};

export interface CoordinateSystem extends OptionsType {
  id?: string;
  bbox?: any;
};

export type GeomapState = {
  value: ExtendedMapFeature[];
  wmsLayers: {
    name: string;
    source: string;
  }[];
};

const initialState: GeomapState = {
  value: [],
  wmsLayers: [],
};

export const geomapSlice = createSlice({
  name: "geomap",
  initialState,
  reducers: {
    setFeatures(
      state: GeomapState,
      action: PayloadAction<ExtendedMapFeature[]>
    ) {
      state.value = action.payload;
    }
  },
});

export const { setFeatures } = geomapSlice.actions;

export const getFeatures = () => (state: RootState) => state.geomap.value;

export default geomapSlice.reducer;
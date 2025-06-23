import {
  useEffect,
  useState,
  useRef,
} from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useInjectGlobalStyle } from '@dans-dv/wrapper';
import { type CoordinateSystem, type ExtendedMapFeature, type OptionsType } from "./slice";
import GLMap, {
  ScaleControl,
  NavigationControl,
  type LngLatBoundsLike,
  type MapRef,
} from "react-map-gl/maplibre";
import mapLibreCss from "maplibre-gl/dist/maplibre-gl.css?inline";
import mapCss from "./Map.css?inline";
import type { Point, Polygon, LineString } from "geojson";
import { useFetchGeonamesFreeTextQuery, type PlaceOption } from "./api/geonames";
import { useFetchCoordinateSystemsQuery, useLazyTransformCoordinatesQuery } from "./api/maptiler";
import { useDebounce, useDebouncedCallback } from "use-debounce";
import { DrawControls } from './Draw';
import type { DrawConfig } from './';
import { FeatureTable } from './Table';
import { AutocompleteAPIField } from '@dans-dv/inputs';

/**
 * Map field
 * Lookup base location/point via Geonames.
 * Allows user to edit selected point from Geonames location, or draw a line, square, polygon, circle.
 * Gets saved as GeoJSON.
 * Also allows user to select Geobasis standard.
 */

const DrawMap = ({ setValue, value, draw }: {
    setValue: (v: ExtendedMapFeature[]) => void;
    value: ExtendedMapFeature[];
    draw?: DrawConfig;
}) => {
  useInjectGlobalStyle([
    { id: 'maplibre', cssText: mapLibreCss },
    { id: 'custommap', cssText: mapCss },
  ]);
  const [geonamesValue, setGeonamesValue] = useState<PlaceOption>();
  const [coordinateSystem, setCoordinateSystem] = useState<CoordinateSystem>();
  const [viewState, setViewState] = useState<{
    longitude?: number;
    latitude?: number;
    zoom?: number;
    bounds?: LngLatBoundsLike;
  }>({
    longitude: 4.342779,
    latitude: 52.080738,
    zoom: 8,
  });
  const [features, setLocalFeatures] = useState<ExtendedMapFeature[]>(value || []);
  const [getConvertedCoordinates] = useLazyTransformCoordinatesQuery();
  const mapRef = useRef<MapRef>(null);

  // write this to redux store with some debouncing for performance
  // separated from all the local state changes, as the global state would get changed a bit too often otherwise
  const debouncedSaveToStore = useDebouncedCallback(
    () => setValue(features),
    800,
  );

  useEffect(() => {
    // on features change, write this to store with a debounce
    if (features.length > 0) {
      debouncedSaveToStore();
    }
  }, [features]);

  const [selectedFeatures, setSelectedFeatures] = useState<
    (string | number | undefined)[]
  >([]);

  useEffect(() => {
    const setGeoNamesFeature = async () => {
      // get the converted coordinates if needed
      const convertedCoordinates =
        coordinateSystem ?
          await getConvertedCoordinates({
            type: "Point",
            coordinates: geonamesValue?.coordinates,
            to: coordinateSystem?.value,
            from: 4326,
          })
        : undefined;

      // move map to selected GeoNames value
      setViewState({
        longitude: geonamesValue?.coordinates![0],
        latitude: geonamesValue?.coordinates![1],
        zoom: 10,
      });

      // and add feature to map if not added yet, checks geonames id
      const newFeature: ExtendedMapFeature<Point> = {
        id: geonamesValue?.id,
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: geonamesValue?.coordinates as number[],
        },
        properties: {},
        geonames: geonamesValue,
        coordinateSystem: coordinateSystem,
        originalCoordinates: convertedCoordinates?.data as
          | number[]
          | number[][]
          | number[][][],
      };
      setLocalFeatures([
        ...new Map(
          [...features, newFeature].map((item) => [item.id, item]),
        ).values(),
      ]);
    };
    if (geonamesValue) {
      setGeoNamesFeature();
    }
  }, [geonamesValue]);

  useEffect(() => {
    // update all feature's originalCoordinates value and calculate coordinates of existing features
    // when coordinate system selection changes
    const asyncFeatures = async () => {
      const updatedCoordinatesFeatures = await Promise.all(
        // loop through all features and calculate new coordinates
        features.map(async (f) => {
          const convertedCoordinates = await getConvertedCoordinates({
            type: f.geometry.type,
            coordinates: (f.geometry as Point | Polygon | LineString)
              .coordinates,
            to: coordinateSystem?.value,
            from: 4326,
          });
          return {
            ...f,
            coordinateSystem: coordinateSystem,
            originalCoordinates: convertedCoordinates?.data as
              | number[]
              | number[][]
              | number[][][],
          };
        }),
      );
      setLocalFeatures(updatedCoordinatesFeatures);
    };
    if (coordinateSystem) {
      console.log(coordinateSystem.bbox);
      asyncFeatures();
      // set bounding box of the selected coordinate system
      setViewState({ bounds: coordinateSystem.bbox as LngLatBoundsLike });
    } else {
      setLocalFeatures(
        features.map((f) => ({
          ...f,
          coordinateSystem: undefined,
          originalCoordinates: undefined,
        })),
      );
    }
  }, [coordinateSystem]);

  return (
    <Box mb={2}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ flex: 1 }}
        spacing={2}
      >
        <GeonamesApiField
          value={geonamesValue}
          setValue={setGeonamesValue}
          label="Select a location"
        />
        <FindCoordinateSystemField
          value={coordinateSystem}
          setValue={setCoordinateSystem}
          label="Select a coordinate system"
        />
      </Stack>
        <Box pt={1} sx={{ width: "60rem", maxWidth: "90vw" }}>
          <GLMap
            {...viewState}
            ref={mapRef}
            onMove={(e) => setViewState(e.viewState)}
            style={{
              width: "100%",
              height: 400,
              borderRadius: "5px",
              border: "1px solid rgba(0,0,0,0.23)",
            }}
            mapStyle={`https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`}
            maxBounds={coordinateSystem?.bbox as LngLatBoundsLike}
          >
            <NavigationControl position="top-left" />
            <ScaleControl />
            <DrawControls
              features={features}
              setFeatures={setLocalFeatures}
              setSelectedFeatures={setSelectedFeatures}
              coordinateSystem={coordinateSystem}
              draw={draw}
            />
          </GLMap>
          {features.length > 0 && (
            // let's user edit features coordinates directly
            <FeatureTable
              features={features}
              setFeatures={setLocalFeatures}
              selectedFeatures={selectedFeatures}
              coordinateSystem={coordinateSystem}
            />
          )}
        </Box>
      </Box>
  );
};

export default DrawMap;

const GeonamesApiField = ({
  value,
  setValue,
  disabled,
  label,
}: {
  value?: any;
  setValue: any;
  disabled?: boolean;
  label?: string;
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const debouncedInputValue = useDebounce(inputValue, 500)[0];
  // Fetch data on input change
  const { data, isFetching, isLoading } =
    useFetchGeonamesFreeTextQuery(debouncedInputValue, {
      skip: debouncedInputValue === "",
    });

  return (
    <AutocompleteAPIField
      inputValue={inputValue}
      setInputValue={setInputValue}
      debouncedInputValue={debouncedInputValue}
      data={data}
      value={value}
      label={label}
      onSave={setValue}
      disabled={disabled}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
};

const FindCoordinateSystemField = ({
  value,
  setValue,
  disabled,
  label,
}: {
  value?: any;
  setValue: any;
  disabled?: boolean;
  label?: string;
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const debouncedInputValue = useDebounce(inputValue, 500)[0];
  // Fetch data on input change
  const { data, isFetching, isLoading } = useFetchCoordinateSystemsQuery(debouncedInputValue, {
    skip: debouncedInputValue === "",
  });

  return (
    <AutocompleteAPIField
      inputValue={inputValue}
      setInputValue={setInputValue}
      debouncedInputValue={debouncedInputValue}
      data={data}
      value={value as OptionsType}
      label={label}
      onSave={setValue}
      disabled={disabled}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
};

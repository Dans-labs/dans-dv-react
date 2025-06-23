import {
  useState,
  type SetStateAction,
  type Dispatch,
} from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { type CoordinateSystem, type ExtendedMapFeature, type OptionsType } from "./slice";
import type { Point, Polygon, LineString } from "geojson";
import PolylineIcon from "@mui/icons-material/Polyline";
import PlaceIcon from "@mui/icons-material/Place";
import PentagonIcon from "@mui/icons-material/Pentagon";
import { useFetchPlaceReverseLookupQuery } from "./api/geonames";
import { useLazyTransformCoordinatesQuery } from "./api/maptiler";
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import RectangleIcon from '@mui/icons-material/Rectangle';
import { isRectangle } from "./helpers";

interface Column {
  id: string;
  label?: string;
  width?: number;
}

export const FeatureTable = ({
  features,
  setFeatures,
  selectedFeatures,
  coordinateSystem,
}: {
  features: ExtendedMapFeature[];
  setFeatures: Dispatch<SetStateAction<ExtendedMapFeature[]>>;
  selectedFeatures: (string | number | undefined)[];
  coordinateSystem?: CoordinateSystem;
}) => {
  const [getConvertedCoordinates] = useLazyTransformCoordinatesQuery();

  const columns: readonly Column[] = [
    { id: "feature", width: 25 },
    {
      id: "coordinates",
      label: "Coordinates",
      width: coordinateSystem === undefined ? 500 : 300,
    },
    ...(coordinateSystem ?
      [
        {
          id: "transposedCoordinates",
          label: `Transposed in ${coordinateSystem.id}`,
          width: 300,
        },
      ]
    : []),
    { id: "geonames", label: "Geonames" },
    { id: "delete", width: 25 },
  ];

  const setCoordinates = async ({
    value,
    featureIndex,
    coordinateIndex,
    groupIndex,
    coordinateSystem,
    isWgs84,
  }: {
    value: number;
    featureIndex: number;
    coordinateIndex: number;
    groupIndex?: number;
    coordinateSystem?: OptionsType;
    isWgs84?: boolean;
  }) => {
    // conversion expects a lat/lon pair.
    // set the new coordinates
    // A user can either both the WSG84 coordinates, and the coordinates from the optional alternative system
    // We need to handle both changes and calculate the other coordinate system's values
    // For simplicity, our originalCoordinates object has the same geoJson structure as the geometry.coordinates object
    const newFeatures = await Promise.all(
      features.map(async (feature, index) => {
        if (index === featureIndex) {
          const coordinatesToChange: number[] | number[][] | number[][][] =
            isWgs84 ?
              (feature.geometry as Point | Polygon | LineString).coordinates
            : (feature.originalCoordinates as
                | number[]
                | number[][]
                | number[][][]);

          const updatedCoordinates =
            feature.geometry.type === "Point" ?
              (coordinatesToChange as number[]).map((coordinate, i) =>
                i === coordinateIndex ? value : coordinate,
              )
            : feature.geometry.type === "LineString" ?
              (coordinatesToChange as number[][]).map((coordinateGroup, i) =>
                i === groupIndex ?
                  coordinateGroup.map((coordinate, j) =>
                    j === coordinateIndex ? value : coordinate,
                  )
                : coordinateGroup,
              )
            : feature.geometry.type === "Polygon" ?
              (() => {
                // First, update the first set of coordinates
                const updatedCoordinates = (
                  coordinatesToChange as number[][][]
                )[0].map((coordinateGroup, i) =>
                  i === groupIndex ?
                    coordinateGroup.map((coordinate, j) =>
                      j === coordinateIndex ? value : coordinate,
                    )
                  : coordinateGroup,
                );
                // Ensure the last set of coordinates is the same as the first one
                const firstSet = updatedCoordinates[0];
                updatedCoordinates[updatedCoordinates.length - 1] = firstSet;

                return [updatedCoordinates];
              })()
            : (feature.geometry as any).coordinates;

          // convert coords if needed
          const convertedCoordinates =
            coordinateSystem ?
              await getConvertedCoordinates({
                type: feature.geometry.type,
                coordinates: updatedCoordinates,
                to: isWgs84 ? coordinateSystem.value : 4326,
                from: isWgs84 ? 4326 : coordinateSystem.value,
              })
            : null;

          const updatedFeature = {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates:
                isWgs84 ? updatedCoordinates : convertedCoordinates?.data,
            },
            geonames: undefined,
            originalCoordinates:
              isWgs84 && coordinateSystem ?
                convertedCoordinates?.data
              : updatedCoordinates,
          };
          return updatedFeature;
        } else {
          return feature;
        }
      }),
    );
    // Update the features and geoNames
    setFeatures(newFeatures);
  };

  const setGeonames = (
    geonamesValue: OptionsType | undefined,
    index: number,
  ) => {
    // set the new geonames value
    setFeatures(
      features.map((feature, i) =>
        i === index ? { ...feature, geonames: geonamesValue } : feature,
      ),
    );
  };

  const deleteFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <TableContainer
      sx={{
        maxHeight: 440,
        border: "1px solid rgba(224, 224, 224, 1)",
        mt: 1,
        borderRadius: 1,
      }}
      component={Box}
    >
      <Table stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id} style={{ width: column.width }}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {features.map((feature, i) => (
            <TableRow
              key={i}
              sx={{
                backgroundColor:
                  selectedFeatures.indexOf(feature.id) !== -1 ?
                    "#fffae5"
                  : "transparent",
              }}
            >
              <TableCell>
                {feature.geometry.type === "Point" ?
                  <PlaceIcon color={!feature.geonames ? "error" : "primary"} />
                : feature.geometry.type === "LineString" ?
                  <PolylineIcon color={!feature.geonames ? "error" : "primary"} />
                : feature.geometry.type === "Polygon" && isRectangle(feature.geometry.coordinates[0]) ?
                  <RectangleIcon color={!feature.geonames ? "error" : "primary"} />
                : feature.geometry.type === "Polygon" ?
                  <PentagonIcon color={!feature.geonames ? "error" : "primary"} />
                : null}
              </TableCell>
              <TableCell>
                <FeatureCoordinateCell
                  feature={feature}
                  onChange={setCoordinates}
                  featureIndex={i}
                  coordinateSystem={coordinateSystem}
                  isWgs84={true}
                />
              </TableCell>
              {coordinateSystem && (
                <TableCell>
                  <FeatureCoordinateCell
                    feature={feature}
                    onChange={setCoordinates}
                    featureIndex={i}
                    coordinateSystem={coordinateSystem}
                  />
                </TableCell>
              )}
              <TableCell>
                <ReverseLookupGeonamesField
                  setValue={setGeonames}
                  value={feature.geonames}
                  featureIndex={i}
                  lat={
                    feature.geometry.type === "Point" ?
                      feature.geometry.coordinates[1]
                    : feature.geometry.type === "LineString" ?
                      feature.geometry.coordinates[
                        Math.floor(feature.geometry.coordinates.length / 2)
                      ][1]
                    : (feature.geometry as Polygon).coordinates[0][
                        Math.floor(
                          (feature.geometry as Polygon).coordinates[0].length /
                            2,
                        )
                      ][1]

                  }
                  lng={
                    feature.geometry.type === "Point" ?
                      feature.geometry.coordinates["0"]
                    : feature.geometry.type === "LineString" ?
                      feature.geometry.coordinates[
                        Math.floor(feature.geometry.coordinates.length / 2)
                      ][0]
                    : (feature.geometry as Polygon).coordinates[0][
                        Math.floor(
                          (feature.geometry as Polygon).coordinates[0].length /
                            2,
                        )
                      ][0]

                  }
                />
              </TableCell>
              <TableCell>
                <IconButton
                  color="error"
                  aria-label="Delete"
                  size="small"
                  onClick={() => deleteFeature(i)}
                >
                  <RemoveCircleOutlineIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const FeatureCoordinateCell = ({
  feature,
  onChange,
  featureIndex,
  isWgs84,
  coordinateSystem,
}: {
  feature: ExtendedMapFeature;
  featureIndex: number;
  onChange: (object: any) => void;
  isWgs84?: boolean;
  coordinateSystem?: OptionsType;
}) => {
  // Check if this input box is wsg84 or a different coordinate system
  const coordinates =
    isWgs84 ?
      (feature.geometry as Point | Polygon | LineString).coordinates
    : feature.originalCoordinates;

  return (
    feature.geometry.type === "Point" ?
      <CoordinateGroup
        onChange={onChange}
        coordinates={coordinates as number[]}
        featureIndex={featureIndex}
        isWgs84={isWgs84}
        coordinateSystem={coordinateSystem}
      />
    : feature.geometry.type === "LineString" ?
      Array.isArray(coordinates) &&
      (coordinates as number[][]).map((coordGroup, groupIndex) => (
        <CoordinateGroup
          key={groupIndex}
          onChange={onChange}
          coordinates={coordGroup}
          featureIndex={featureIndex}
          isWgs84={isWgs84}
          groupIndex={groupIndex}
          coordinateSystem={coordinateSystem}
        />
      ))
    : feature.geometry.type === "Polygon" ?
      Array.isArray(coordinates) &&
      (coordinates as number[][][])[0].map((coordGroup, groupIndex) => (
        <CoordinateGroup
          key={groupIndex}
          onChange={onChange}
          coordinates={coordGroup}
          featureIndex={featureIndex}
          isWgs84={isWgs84}
          groupIndex={groupIndex}
          disabled={
            groupIndex ===
            (feature.geometry as Polygon).coordinates[0].length - 1
          }
          coordinateSystem={coordinateSystem}
        />
      ))
    : null
  );
};

const CoordinateGroup = ({
  onChange,
  coordinates,
  featureIndex,
  isWgs84,
  groupIndex,
  disabled,
  coordinateSystem,
}: {
  onChange: (object: any) => void;
  coordinates?: number[] | number[][] | number[][][];
  featureIndex: number;
  isWgs84?: boolean;
  groupIndex?: number;
  disabled?: boolean;
  coordinateSystem?: OptionsType;
}) => {
  return (
    <Stack spacing={1} direction="row">
      {coordinates?.map((coord, coordinateIndex) => (
        <TextField
          disabled={disabled}
          type="number"
          size="small"
          value={coord}
          key={coordinateIndex}
          label={
            coordinateIndex === 1 ?
              isWgs84 ? "lat" : "Y"
            : isWgs84 ? "lng" : "X"
          }
          onChange={(e) =>
            onChange({
              value: parseFloat(e.target.value),
              featureIndex: featureIndex,
              coordinateIndex: coordinateIndex,
              groupIndex: groupIndex,
              coordinateSystem: coordinateSystem,
              isWgs84: isWgs84,
            })
          }
        />
      ))}
    </Stack>
  );
};

// TODO: find something else for this, as this (geonames extendedFindNearby) does not work great and does not
// always find a relevant value. Also, for multipoint shapes, we can only check the nearby value of a single point,
// which might not be the most relevant point.
const ReverseLookupGeonamesField = ({
  lat,
  lng,
  featureIndex,
  value,
  setValue,
  disabled,
}: {
  lat: number;
  lng: number;
  featureIndex: number;
  value: OptionsType | undefined;
  setValue: (option: OptionsType | undefined, index: number) => void;
  disabled?: boolean;
}) => {
  // TODO: we need a better reverse lookup
  const [inputValue, setInputValue] = useState<string>("");
  // fetch on open, not directly on prop change
  const [open, setOpen] = useState(false);
  // Fetch data right away, based on coordinates
  const { data, isFetching, isLoading } = useFetchPlaceReverseLookupQuery<any>(
    { lat: lat, lng: lng },
    { skip: !open },
  );

  return (
    <Autocomplete
      fullWidth
      includeInputInList
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={data?.response || []}
      value={value || null}
      inputValue={inputValue || (value?.label as string) || ""}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Find place"
          size="small"
          error={!value}
        />
      )}
      onChange={(_e, newValue, _reason) =>
        setValue(newValue as OptionsType, featureIndex)
      }
      filterOptions={(x) => x}
      onInputChange={(e, newValue) => {
        e && e.type === "change" && setInputValue(newValue);
        e && (e.type === "click" || e.type === "blur") && setInputValue("");
      }}
      noOptionsText="No results found"
      loading={isLoading || isFetching}
      loadingText={
        <Stack direction="row" justifyContent="space-between" alignItems="end">
          Loading... <CircularProgress size={18} />
        </Stack>
      }
      forcePopupIcon
      clearOnBlur
      disabled={disabled}
      getOptionKey={(option) => option.value}
    />
  );
};
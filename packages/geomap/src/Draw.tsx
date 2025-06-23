import {
useEffect,
useState,
useCallback,
type SetStateAction,
type Dispatch,
} from "react";
import Paper from "@mui/material/Paper";
import { type ExtendedMapFeature, type OptionsType } from "./slice";
import { useControl } from "react-map-gl/maplibre";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxDrawCss from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css?inline";
import { styles } from './drawstyles';
import type { Point, Polygon, LineString } from "geojson";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PolylineIcon from "@mui/icons-material/Polyline";
import DeleteIcon from "@mui/icons-material/Delete";
import PlaceIcon from "@mui/icons-material/Place";
import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import PentagonIcon from "@mui/icons-material/Pentagon";
import { useLazyTransformCoordinatesQuery } from "./api/maptiler";
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode';
import RectangleIcon from '@mui/icons-material/Rectangle';
import { useInjectGlobalStyle } from '@dans-dv/wrapper';
import type { DrawConfig } from './';

type FeaturesEvent = { features: ExtendedMapFeature[]; action?: string };

export const DrawControls = ({
  features,
  setFeatures,
  setSelectedFeatures,
  coordinateSystem,
  draw
}: {
  features: ExtendedMapFeature[];
  setFeatures: Dispatch<SetStateAction<ExtendedMapFeature[]>>;
  setSelectedFeatures: Dispatch<
    SetStateAction<(string | number | undefined)[]>
  >;
  coordinateSystem?: OptionsType;
  draw?: DrawConfig;
}) => {
  // define the controls available in the draw menu
  const controls = [
    "simple_select",
    ...(draw?.point ? ["draw_point"] : []),
    ...(draw?.line ? ["draw_line_string"] : []),
    ...(draw?.polygon ? ["draw_polygon"] : []),
    ...(draw?.rectangle ? ["draw_rectangle"] : []),
  ];
  const controlLabels: Record<typeof controls[number], string> = {
    simple_select: "Select",
    draw_point: "Point",
    draw_line_string: "Line",
    draw_polygon: "Polygon",
    draw_rectangle: "Rectangle",
  }
  const [selectedMode, setSelectedMode] = useState(controls[0]);
  const [updatedFeatures, setUpdatedFeatures] =
    useState<ExtendedMapFeature[]>();
  const [getConvertedCoordinates] = useLazyTransformCoordinatesQuery();
  useInjectGlobalStyle([
    { id: 'mapdraw', cssText: mapboxDrawCss },
  ]);

  const onUpdate = useCallback((e: FeaturesEvent) => {
    // Clear geonames key for each feature in the new array,
    // reference must be removed when points change
    const updatedFeatures = e.features.map((feature) => ({
      ...feature,
      geonames: undefined,
    }));

    setUpdatedFeatures(updatedFeatures);
    setSelectedMode(controls[0]);
  }, []);

  useEffect(() => {
    // Have to pull this out of the useCallback function onUpdate, otherwise no access to current coordinate system
    // Listens to any changes in (local state) features, then applies coordinate transformation if neccessary, and updates global features.
    const setNewFeatures = (updatedCoordinateFeatures: ExtendedMapFeature[]) =>
      setFeatures((currFeatures) => [
        ...new Map(
          [...currFeatures, ...updatedCoordinateFeatures].map((item) => [
            item.id,
            item,
          ]),
        ).values(),
      ]);
    const updateOriginalCoordinates = async () => {
      // Do a conversion to the optionally selected alternative coordinate system here
      const updatedCoordinateFeatures = await Promise.all(
        updatedFeatures!.map(async (feature) => {
          const originalCoordinates = await getConvertedCoordinates({
            type: feature.geometry.type,
            coordinates: (feature.geometry as Point | Polygon | LineString)
              .coordinates,
            to: coordinateSystem?.value,
            from: 4326,
          });
          return {
            ...feature,
            originalCoordinates: originalCoordinates?.data as
              | number[]
              | number[][]
              | number[][][],
          };
        }),
      );
      setNewFeatures(updatedCoordinateFeatures);
    };
    if (updatedFeatures && coordinateSystem?.value) {
      updateOriginalCoordinates();
    } else if (updatedFeatures) {
      setNewFeatures(updatedFeatures);
    }
  }, [updatedFeatures]);

  const onDelete = useCallback((e: FeaturesEvent) => {
    const changedFeatureIds = new Set(e.features.map((feature) => feature.id));
    setFeatures((currFeatures) =>
      currFeatures.filter((feature) => !changedFeatureIds.has(feature.id)),
    );
    setSelectedMode(controls[0]);
  }, []);

  const onSelectionChange = useCallback((e: FeaturesEvent) => {
    setSelectedFeatures(e.features.map((feature) => feature.id));
  }, []);

  // manual key listener, since delete is broken in the map libre / mapbox draw combo
  const handleKeyDown = useCallback(
    (event: KeyboardEvent, drawControl: MapboxDraw) => {
      const selectedFeatures = drawControl.getSelected();
      if (event.key === "Delete" && selectedFeatures.features.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        // remove features from store
        onDelete(selectedFeatures);
        // remove them from map
        drawControl.trash();
      }
    },
    [],
  );

  return (
    <Paper
      sx={{
        position: "absolute",
        right: "1rem",
        top: "1rem",
      }}
    >
      <List>
        {controls.map((control) => (
          <ListItem key={control} disablePadding>
            <ListItemButton
              onClick={() => setSelectedMode(control)}
              selected={control === selectedMode}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {control === "simple_select" ?
                  <HighlightAltIcon />
                : control === "draw_point" ?
                  <PlaceIcon />
                : control === "draw_line_string" ?
                  <PolylineIcon />
                : control === "draw_polygon" ?
                  <PentagonIcon />
                : control === "draw_rectangle" ?
                  <RectangleIcon />
                : null}
              </ListItemIcon>
              <ListItemText primary={controlLabels[control]} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              // just simulate the delete keyboard press event on the map canvas
              const target = document.querySelector(".maplibregl-canvas");
              if (target) {
                const keyboardEvent = new KeyboardEvent("keydown", {
                  key: "Delete",
                  code: "Delete",
                  keyCode: 46,
                  charCode: 46,
                  bubbles: true,
                  cancelable: true,
                });
                target.dispatchEvent(keyboardEvent);
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText primary="Delete" />
          </ListItemButton>
        </ListItem>
      </List>
      <DrawControl
        onCreate={onUpdate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        mode={selectedMode}
        onKeyDown={handleKeyDown}
        features={features}
        onSelectionChange={onSelectionChange}
      />
    </Paper>
  );
};

const DrawControl = ({
  onCreate,
  onUpdate,
  onDelete,
  onSelectionChange,
  mode,
  onKeyDown,
  features,
}: {
  onCreate: (e: FeaturesEvent, system: number) => void;
  onUpdate: (e: FeaturesEvent, system: number) => void;
  onDelete: (e: FeaturesEvent) => void;
  onSelectionChange: (e: FeaturesEvent) => void;
  mode: string;
  onKeyDown: (e: KeyboardEvent, c: MapboxDraw) => void;
  features: ExtendedMapFeature[];
}) => {
  const control = useControl<any>(
    () =>
      new MapboxDraw({
        // remove default controls
        displayControlsDefault: false,
        defaultMode: mode,
        keybindings: true,
        clickBuffer: 5,
        styles: styles,
        modes: {
          ...MapboxDraw.modes,
          draw_rectangle: DrawRectangle,
        }
      }),
    ({ map }: { map: any }) => {
      map.on("draw.create", onCreate);
      map.on("draw.update", onUpdate);
      map.on("draw.delete", onDelete);
      map.on("draw.selectionchange", onSelectionChange);

      // Attach the keydown event to the map container
      const canvas = map.getCanvas();
      const handleKeyDownInternal = (event: KeyboardEvent) =>
        onKeyDown(event, control);
      canvas.addEventListener("keydown", handleKeyDownInternal);
      // Store the reference to the internal handler for cleanup
      map._handleKeyDownInternal = handleKeyDownInternal;
    },
    ({ map }: { map: any }) => {
      map.off("draw.create", onCreate);
      map.off("draw.update", onUpdate);
      map.off("draw.delete", onDelete);
      map.off("draw.selectionchange", onSelectionChange);

      // Clean up the keydown event listener
      const canvas = map.getCanvas();
      canvas.removeEventListener("keydown", map._handleKeyDownInternal);
    },
  );

  useEffect(() => {
    // change drawing mode based on user selection
    control.changeMode(mode);
  }, [mode]);

  useEffect(() => {
    // if features prop changes, reflect that on map
    if (control) {
      control.set({
        type: "FeatureCollection",
        features: features,
      });
    }
  }, [features, control]);

  return null;
};
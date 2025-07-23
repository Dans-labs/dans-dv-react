import { type ReactElement } from 'react';
import { SoftwareHeritageForm } from '@dans-dv/swh-registration';
import { Keywords } from '@dans-dv/keywords';
import { FileUpload } from '@dans-dv/file-upload';
import { GeoData } from '@dans-dv/geomap';
import type { RootState, AppDispatch } from "./store";
import { TypedUseSelectorHook } from "react-redux";
import TerminalIcon from '@mui/icons-material/Terminal';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import KeyIcon from '@mui/icons-material/Key';
import PublicIcon from '@mui/icons-material/Public';

export type MenuKey = 'swh' | 'fileUpload' | 'keywords' | 'geo';
export type KeywordsMenuKey = 'wikidata' | 'geonames' | 'elsst' | 'narcis' | 'dansCollections' | 'gettyAat';

type DrawerRenderProps = {
  useAppDispatch: () => AppDispatch;
  useAppSelector: TypedUseSelectorHook<RootState>;
};

export type MenuItemConfig = {
  key: MenuKey;
  label: string;
  isEnabled: boolean;
  renderDrawerContent: (hooks: DrawerRenderProps) => ReactElement | null;
  icon: ReactElement;
};

export type MenuConfig = {
  swh?: boolean;
  fileUpload?: boolean;
  keywords?: {
    [K in KeywordsMenuKey]?: boolean;
  };
  geo?: {
    geonames?: boolean;
    map?: {
      draw?: {
        point?: boolean;
        line?: boolean;
        polygon?: boolean;
        rectangle?: boolean;
      };
    };
  };
};

export const getMenuItems = (config: MenuConfig): MenuItemConfig[] => [
  {
    key: 'swh',
    label: 'Register with Software Heritage',
    isEnabled: !!config.swh,
    renderDrawerContent: (props: DrawerRenderProps) => <SoftwareHeritageForm {...props} />,
    icon: <TerminalIcon />,
  },
  {
    key: 'fileUpload',
    label: 'Large file uploads and processing',
    isEnabled: !!config.fileUpload,
    renderDrawerContent: (props: DrawerRenderProps) => <FileUpload {...props} />,
    icon: <CloudUploadIcon />,
  },
  {
    key: 'keywords',
    label: 'Easy keyword management',
    isEnabled: !!config.keywords,
    renderDrawerContent: (props: DrawerRenderProps) => config.keywords ? <Keywords {...props} config={config.keywords} /> : null,
    icon: <KeyIcon />,
  },
  {
    key: 'geo',
    label: 'Geospatial data',
    isEnabled: !!config.geo,
    renderDrawerContent: (props: DrawerRenderProps) => config.geo ? <GeoData {...props} config={config.geo} /> : null,
    icon: <PublicIcon />,
  },
];

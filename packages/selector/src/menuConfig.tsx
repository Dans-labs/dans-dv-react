import { type ReactElement } from 'react';
import { SoftwareHeritageForm } from '@dans-dv/swh-registration';
import { Keywords } from '@dans-dv/keywords';
import { FileUpload } from '@dans-dv/file-upload';
import type { RootState, AppDispatch } from "./store";
import { TypedUseSelectorHook } from "react-redux";
import TerminalIcon from '@mui/icons-material/Terminal';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import KeyIcon from '@mui/icons-material/Key';

export type MenuKey = 'swh' | 'fileUpload' | 'keywords';
export type KeywordsMenuKey = 'wikidata';

type DrawerRenderProps = {
  useAppDispatch: () => AppDispatch;
  useAppSelector: TypedUseSelectorHook<RootState>;
};

export type MenuItemConfig = {
  key: MenuKey;
  label: string;
  isEnabled: boolean;
  renderDrawerContent: (hooks: DrawerRenderProps) => ReactElement;
  icon: ReactElement;
};

export type MenuConfig = {
  swh?: boolean;
  fileUpload?: boolean;
  keywords?: {
    [K in KeywordsMenuKey]?: boolean;
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
    label: 'Enhanced file upload',
    isEnabled: !!config.fileUpload,
    renderDrawerContent: (props: DrawerRenderProps) => <FileUpload {...props} />,
    icon: <CloudUploadIcon />,
  },
  {
    key: 'keywords',
    label: 'Easy keyword management',
    isEnabled: !!config.keywords,
    renderDrawerContent: (props: DrawerRenderProps) => <Keywords {...props} config={config.keywords} />,
    icon: <KeyIcon />,
  },
];

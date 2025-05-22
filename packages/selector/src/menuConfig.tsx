import { type ReactElement } from 'react';
import { SoftwareHeritageForm } from '@dans-dv/swh-registration';
import { FileUpload } from '@dans-dv/file-upload';
import type { RootState, AppDispatch } from "./store";
import { TypedUseSelectorHook } from "react-redux";
import TerminalIcon from '@mui/icons-material/Terminal';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export type MenuKey = 'swh' | 'fileUpload';

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

export type MenuConfig = Partial<Record<MenuKey, boolean>>;

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
];

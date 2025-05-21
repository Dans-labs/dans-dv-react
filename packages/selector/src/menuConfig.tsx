import { type ReactElement } from 'react';
import { SoftwareHeritageForm } from '@dans-dv/swh-registration';
import type { RootState, AppDispatch } from "./store";
import { TypedUseSelectorHook } from "react-redux";

export type MenuKey = 'swh';

type DrawerRenderProps = {
  useAppDispatch: () => AppDispatch;
  useAppSelector: TypedUseSelectorHook<RootState>;
};

export type MenuItemConfig = {
  key: MenuKey;
  label: string;
  isEnabled: boolean;
  renderDrawerContent: (hooks: DrawerRenderProps) => ReactElement;
};

export type MenuConfig = Partial<Record<MenuKey, boolean>>;

export const getMenuItems = (config: MenuConfig): MenuItemConfig[] => [
  {
    key: 'swh',
    label: 'Register with Software Heritage',
    isEnabled: !!config.swh,
    renderDrawerContent: (props: DrawerRenderProps) => <SoftwareHeritageForm {...props} />,
  },
];

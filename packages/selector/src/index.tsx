import { useState, type MouseEvent } from 'react';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { getMenuItems } from './menuConfig';
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import { useAppDispatch, useAppSelector } from "./hooks";

export default function MenuButton({ config }: { config: MenuConfig }) {
  const [edit, setEdit] = useState<null | string>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = getMenuItems(config).filter(item => item.isEnabled);

  return (
    <ReduxProvider store={store}>
    <Box
      sx={{
        mt: 2,        
      }}
    >
      <Button
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        variant="contained"
        sx={{ width: '100%' }}
      >
        Advanced edit
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {menuItems.map(item => (
          <MenuItem
            key={item.key}
            onClick={() => {
              handleClose();
              setEdit(item.key);
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      <Drawer open={edit !== null} onClose={() => setEdit(null)}>
        {/* We can add a side menu here, todo */}
        <Box sx={{ p: 4, maxWidth: '40rem' }}>
          {edit && menuItems.find(item => item.key === edit)?.renderDrawerContent({
            useAppDispatch,
            useAppSelector,
          })}
        </Box>
      </Drawer>

    </Box>
    </ReduxProvider>
  );
}
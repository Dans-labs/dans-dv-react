import { useState, type MouseEvent } from 'react';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { getMenuItems } from './menuConfig';
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import { useAppDispatch, useAppSelector } from "./hooks";
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';

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
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>

        <Drawer open={edit !== null} onClose={() => setEdit(null)}>
          <Stack direction="row">
            <List sx={{ borderRight: '1px solid #ccc', position: 'fixed', height: '100vh'}}>
              <ListItem disablePadding disableGutters sx={{ mb: 1 }}>
                <ListItemButton onClick={() => setEdit(null)} sx={{ pt: 1.5, pb: 1.5 }} >
                  <ListItemIcon sx={{ minWidth: 'auto' }}>
                    <CloseIcon/>
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
              <Divider />
              {menuItems.map(item => (
                <ListItem key={item.key} disablePadding>
                  <Tooltip title={item.label} placement="right">
                    <ListItemButton onClick={() => setEdit(item.key)}>
                      <ListItemIcon sx={{ minWidth: 'auto' }}>
                        {item.icon}
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
            <Box sx={{ pr: 6, pt: 4, pb: 4, pl: 12, maxWidth: '40rem' }}>
              {edit && menuItems.find(item => item.key === edit)?.renderDrawerContent({
                useAppDispatch,
                useAppSelector,
              })}
            </Box>
          </Stack>
        </Drawer>
      </Box>
    </ReduxProvider>
  );
}
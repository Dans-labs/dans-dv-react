import { useState, type MouseEvent } from 'react';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { SoftwareHeritageForm } from '@dans-dv/swh-registration'

type MenuConfig = {
  swh?: boolean;
}

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

  return (
    <div>
      <Button
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        Advanced edit
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        { config.swh && 
          <MenuItem 
            onClick={() => { 
              handleClose();
              setEdit('swh');
            }}
          >
              Register with Software Heritage
          </MenuItem> 
        }
      </Menu>

      <Drawer open={edit !== null} onClose={() => setEdit(null)}>
        { edit === 'swh' && <SoftwareHeritageForm /> }
      </Drawer>

    </div>
  );
}
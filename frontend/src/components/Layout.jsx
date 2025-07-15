

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Paper, Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ReplayIcon from '@mui/icons-material/Replay';
import SettingsIcon from '@mui/icons-material/Settings';

const menuItems = [
  { label: 'Pedidos', path: '/pedidos-totales', icon: <AssignmentIcon sx={{ mr: 1 }} /> },
  { label: 'Parciales', path: '/parciales', icon: <ListAltIcon sx={{ mr: 1 }} /> },
  { label: 'Devoluciones', path: '/devoluciones', icon: <ReplayIcon sx={{ mr: 1 }} /> },
  { label: 'Configuración', path: '/', icon: <SettingsIcon sx={{ mr: 1 }} /> },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  return (
    <Box sx={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'Avenir, Helvetica, Arial, sans-serif' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#22336b', boxShadow: '0 2px 8px 0 rgba(34,51,107,0.08)' }}>
        <Toolbar sx={{ minHeight: 64, px: { xs: 1, sm: 3, md: 6 } }}>
          <IconButton edge="start" sx={{ mr: 2, color: '#22336b', p: 0.5 }} onClick={handleMenuOpen} aria-controls={openMenu ? 'main-menu' : undefined} aria-haspopup="true" aria-expanded={openMenu ? 'true' : undefined}>
            <DashboardCustomizeOutlinedIcon fontSize="medium" />
          </IconButton>
          <Menu
            id="main-menu"
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            MenuListProps={{ 'aria-labelledby': 'main-menu-button' }}
            PaperProps={{ sx: { minWidth: 220, mt: 1 } }}
          >
            {menuItems.map(item => (
              <MenuItem
                key={item.path}
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={handleMenuClose}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
        <Divider sx={{ bgcolor: '#e0e3e7', height: 2 }} />
      </AppBar>
      <Box sx={{ width: '100%', minHeight: 'calc(100vh - 64px)', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', py: { xs: 2, md: 4 }, boxSizing: 'border-box' }}>
        <Paper elevation={3} sx={{ width: '100%', minHeight: 600, p: { xs: 1, sm: 2, md: 3 }, borderRadius: 0, boxShadow: '0 4px 32px 0 rgba(34,51,107,0.08)', fontFamily: 'Avenir, Helvetica, Arial, sans-serif' }}>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}

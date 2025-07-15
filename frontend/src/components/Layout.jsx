

import React from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../auth.jsx';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { AppBar, Toolbar, Typography, Button, Box, Paper, Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ReplayIcon from '@mui/icons-material/Replay';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SettingsIcon from '@mui/icons-material/Settings';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';

const menuItems = [
  { label: 'Pedidos', path: '/pedidos-totales', icon: <ReceiptLongOutlinedIcon sx={{ mr: 1 }} /> },
  { label: 'Parciales', path: '/parciales', icon: <Inventory2OutlinedIcon sx={{ mr: 1 }} /> },
  { label: 'Cobros y Dev', path: '/devoluciones', icon: <ReplayIcon sx={{ mr: 1 }} /> },
  { label: 'Logística', path: '/logistica', icon: <LocalShippingIcon sx={{ mr: 1 }} /> },
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
  // Determinar el título según la ruta
  let pageTitle = '';
  if (location.pathname === '/pedidos-totales') pageTitle = 'Pedidos Totales';
  else if (location.pathname === '/parciales') pageTitle = 'Pedidos Parciales';
  else if (location.pathname === '/devoluciones') pageTitle = 'Cobros y Devoluciones';
  else if (location.pathname === '/logistica') pageTitle = 'Logística';
  else if (location.pathname === '/') pageTitle = 'Configuración';
  else pageTitle = '';

  // Obtener usuario y rol del contexto de autenticación
  const { user, logout } = useAuth();
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);
  const openUserMenu = Boolean(userMenuAnchor);
  const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  return (
    <Box sx={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'Avenir, Helvetica, Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#22336b', boxShadow: '0 2px 8px 0 rgba(34,51,107,0.08)' }}>
        <Toolbar sx={{ minHeight: 64, px: { xs: 1, sm: 3, md: 6 } }}>
          <IconButton
            edge="start"
            sx={{
              mr: 2,
              color: '#2563eb',
              background: '#fff',
              border: '1.5px solid #e0e3e7',
              p: 1.1,
              borderRadius: 2,
              boxShadow: openMenu ? '0 2px 8px 0 rgba(34,51,107,0.10)' : 'none',
              transition: 'background 0.2s, box-shadow 0.2s, border 0.2s',
              '&:hover': {
                background: '#f4f6fb',
                boxShadow: '0 4px 16px 0 rgba(34,51,107,0.10)',
                border: '1.5px solid #b6c2d2'
              }
            }}
            onClick={handleMenuOpen}
            aria-controls={openMenu ? 'main-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={openMenu ? 'true' : undefined}
          >
            <DashboardCustomizeOutlinedIcon fontSize="medium" />
          </IconButton>
          <Menu
            id="main-menu"
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            MenuListProps={{ 'aria-labelledby': 'main-menu-button' }}
            PaperProps={{
              sx: {
                minWidth: 220,
                mt: 1,
                bgcolor: '#fff',
                border: '1.5px solid #e0e3e7',
                boxShadow: '0 6px 24px 0 rgba(34,51,107,0.10)',
                borderRadius: 2.5,
                p: 0.5
              }
            }}
          >
            <Box sx={{ borderTop: '1.5px solid #f4f6fb', mb: 0.5 }} />
            {menuItems.map(item => (
              <MenuItem
                key={item.path}
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={handleMenuClose}
                sx={{
                  fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
                  fontWeight: 500,
                  fontSize: 17,
                  color: location.pathname === item.path ? '#2563eb' : '#22336b',
                  borderRadius: 1.5,
                  mx: 0.5,
                  my: 0.2,
                  px: 2,
                  py: 1.2,
                  transition: 'background 0.18s, color 0.18s',
                  background: location.pathname === item.path ? '#e8f0fe' : 'transparent',
                  '&:hover': {
                    background: '#f4f6fb',
                    color: '#2563eb'
                  }
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? '#2563eb' : '#22336b', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
          </Menu>
          <Typography
            variant="h5"
            sx={{
              ml: 3,
              fontWeight: 700,
              fontSize: { xs: 22, sm: 26, md: 30 },
              flexGrow: 1,
              color: '#22336b',
              letterSpacing: 0.2,
              fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
              position: 'relative',
              pb: 0.5,
              transition: 'color 0.3s',
              '&::after': {
                content: '""',
                display: 'block',
                position: 'absolute',
                left: 0,
                bottom: 2,
                width: '38%',
                height: 3,
                background: '#2563eb',
                borderRadius: 2,
                opacity: 0.18,
                animation: 'underlineIn 0.7s cubic-bezier(.4,0,.2,1)'
              }
            }}
          >
            {pageTitle}
          </Typography>
          <style>{`
            @keyframes underlineIn {
              from { width: 0; opacity: 0; }
              to { width: 38%; opacity: 0.18; }
            }
          `}</style>
        {/* Usuario y rol alineados a la derecha */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          {user && (
            <>
              <Box
                onClick={handleUserMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  bgcolor: '#f8fafc',
                  px: 2.2,
                  py: 1,
                  borderRadius: 3,
                  boxShadow: '0 2px 12px 0 rgba(34,51,107,0.10)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, background 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 24px 0 rgba(34,51,107,0.16)',
                    bgcolor: '#e8f0fe',
                  },
                  minWidth: 160
                }}
              >
                <Box sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  bgcolor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px 0 rgba(34,51,107,0.10)',
                  mr: 1
                }}>
                  <AccountCircleIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: '#22336b', fontSize: 16, lineHeight: 1.1, maxWidth: 90, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.nombre}</Typography>
                  <Typography sx={{ fontWeight: 500, color: '#2563eb', fontSize: 13, lineHeight: 1.1, textTransform: 'capitalize' }}>{user.rol}</Typography>
                </Box>
                <ArrowDropDownIcon sx={{ color: '#2563eb', ml: 0.5 }} />
              </Box>
              <Menu
                anchorEl={userMenuAnchor}
                open={openUserMenu}
                onClose={handleUserMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { mt: 1, minWidth: 170, borderRadius: 2, boxShadow: '0 6px 24px 0 rgba(34,51,107,0.12)' } }}
              >
                <MenuItem onClick={() => { handleUserMenuClose(); logout(); }} sx={{ color: '#e53935', fontWeight: 600 }}>
                  <LogoutIcon sx={{ mr: 1 }} /> Cerrar sesión
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
        </Toolbar>
        <Divider sx={{ bgcolor: '#e0e3e7', height: 2 }} />
      </AppBar>
      <Box sx={{ width: '100%', flex: 1, minHeight: 'calc(100vh - 64px - 48px)', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', py: { xs: 2, md: 4 }, boxSizing: 'border-box' }}>
        <Paper elevation={3} sx={{ width: '100%', minHeight: 600, p: { xs: 1, sm: 2, md: 3 }, borderRadius: 0, boxShadow: '0 4px 32px 0 rgba(34,51,107,0.08)', fontFamily: 'Avenir, Helvetica, Arial, sans-serif' }}>
          {children}
        </Paper>
      </Box>
      <Box component="footer" sx={{
        width: '100%',
        py: 0.7,
        px: 2,
        background: '#f6f8fa',
        borderTop: '1.5px solid #e0e3e7',
        textAlign: 'center',
        color: '#22336b',
        fontWeight: 500,
        fontSize: 15,
        position: 'fixed',
        left: 0,
        bottom: 0,
        zIndex: 1201
      }}>
        © {new Date().getFullYear()} <a href="https://www.tabix.app" target="_blank" rel="noopener noreferrer" style={{ color: '#22336b', textDecoration: 'none', fontWeight: 600, transition: 'text-decoration 0.2s' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>Tabix Group</a>. Todos los derechos reservados.
      </Box>
    </Box>
  );
}

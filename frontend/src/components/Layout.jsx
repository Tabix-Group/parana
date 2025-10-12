import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box, Paper, Divider,
  ListItemIcon, ListItemText, Avatar, Drawer, List, ListItemButton, ListItem,
  CssBaseline, Tooltip
} from '@mui/material';

import {
  Logout, ArrowDropDown, ChevronLeft, ChevronRight, AccountCircleRounded,
  DashboardCustomizeRounded, Inventory2Rounded, PaidRounded,
  LocalShippingRounded, SettingsRounded, ShoppingBagRounded,
  AssignmentTurnedInRounded, PeopleAltRounded, ReceiptLongRounded, FactCheckRounded
} from '@mui/icons-material';

import { useAuth } from '../auth.jsx';

const drawerWidth = 240;
const collapsedWidth = 72;

const transitionStyle = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
const bgActive = '#e0f2fe';
const textActive = '#0c4a6e';
const textDefault = '#1e293b';
const hoverBg = '#f1f5f9';

const menuItems = [
  { label: 'Pedidos', path: '/pedidos-totales', icon: <ReceiptLongRounded sx={{ color: '#60a5fa' }} /> },
  { label: 'Parciales', path: '/parciales', icon: <FactCheckRounded sx={{ color: '#34d399' }} /> },
  { label: 'Movimientos de Cobros y Materiales', path: '/devoluciones', icon: <PaidRounded sx={{ color: '#f87171' }} /> },
  { label: 'Retiran', path: '/retiran', icon: <AssignmentTurnedInRounded sx={{ color: '#fbbf24' }} /> },
  { label: 'Logística', path: '/logistica', icon: <LocalShippingRounded sx={{ color: '#a78bfa' }} /> },
  { label: 'Configuración', path: '/', icon: <SettingsRounded sx={{ color: '#94a3b8' }} /> },
];

const getPageTitle = (pathname) => {
  const item = menuItems.find((item) => item.path === pathname);
  return item ? item.label : '';
};

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const [userAnchor, setUserAnchor] = React.useState(null);
  const [openSidebar, setOpenSidebar] = React.useState(false);

  const toggleDrawer = () => setOpenSidebar((prev) => !prev);
  const handleUserMenu = (e) => setUserAnchor(e.currentTarget);
  const handleCloseUserMenu = () => setUserAnchor(null);
  
  // Collapse sidebar when navigating to a menu item
  const handleMenuItemClick = (path) => {
    if (openSidebar) setOpenSidebar(false);
  } 

  const drawerWidthCurrent = openSidebar ? drawerWidth : collapsedWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb' }}>
      <CssBaseline />

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidthCurrent,
          flexShrink: 0,
          transition: 'width 0.3s ease-in-out',
          [`& .MuiDrawer-paper`]: {
            width: drawerWidthCurrent,
            transition: 'width 0.3s ease-in-out',
            boxSizing: 'border-box',
            overflowX: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            borderRight: '1px solid #e2e8f0',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          },
        }}
      >
        <Toolbar sx={{ minHeight: 72, px: openSidebar ? 2 : 1.5, justifyContent: openSidebar ? 'space-between' : 'center' }}>
          {openSidebar && (
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'Inter, Segoe UI, Roboto, sans-serif', display: 'flex', alignItems: 'center' }}>
              <DashboardCustomizeRounded sx={{ mr: 1, color: '#3b82f6' }} /> Panel
            </Typography>
          )}
          <IconButton onClick={toggleDrawer} size="small">
            {openSidebar ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map(({ label, path, icon }) => {
            const isActive = location.pathname === path;
            return (
              <ListItem key={path} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={!openSidebar ? label : ''} placement="right" arrow>
                  <ListItemButton
                    component={Link}
                    to={path}
                    selected={isActive}
                    onClick={() => handleMenuItemClick(path)}
                    sx={{
                      justifyContent: openSidebar ? 'initial' : 'center',
                      px: 2.2,
                      py: 1.5,
                      my: 0.5,
                      mx: 1,
                      borderRadius: 2,
                      color: isActive ? textActive : textDefault,
                      bgcolor: isActive ? bgActive : 'transparent',
                      transition: transitionStyle,
                      '&:hover': {
                        bgcolor: 'linear-gradient(90deg, #f1f5f9 0%, #e0f2fe 100%)',
                        color: textActive,
                        transform: 'translateX(4px) scale(1.02)',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
                      },
                      '& .MuiListItemIcon-root': {
                        minWidth: 0,
                        mr: openSidebar ? 1.8 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                        transition: transitionStyle,
                      },
                    }}
                  >
                    {icon}
                    {openSidebar && (
                      <ListItemText
                        primary={label}
                        primaryTypographyProps={{
                          fontSize: 15,
                          fontWeight: isActive ? 600 : 500,
                          sx: { opacity: openSidebar ? 1 : 0, transition: transitionStyle },
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)',
            color: '#1e293b',
            borderBottom: '1px solid #e0e3e7',
            zIndex: 1201,
          }}
        >
          <Toolbar sx={{ minHeight: 72, px: { xs: 2, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: 22, fontFamily: 'Inter, Segoe UI, Roboto, sans-serif', color: '#0f172a', flex: '1 1 0', textAlign: 'left' }}
              >
                {getPageTitle(location.pathname)}
              </Typography>
              <Box sx={{ flex: '1 1 0', display: 'flex', justifyContent: 'center' }}>
                <img src="/logo.png" alt="Logo" style={{ width: 120, height: 48, objectFit: 'contain', display: 'block' }} />
              </Box>
              <Box sx={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              </Box>
            </Box>

            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  onClick={handleUserMenu}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    borderRadius: 3,
                    bgcolor: '#f1f4f9',
                    cursor: 'pointer',
                    gap: 1,
                    '&:hover': {
                      bgcolor: '#e0e7ff',
                    },
                  }}
                >
                  <Avatar sx={{ bgcolor: '#2563eb', width: 36, height: 36 }}>
                    <AccountCircleRounded sx={{ color: '#fff', fontSize: 24 }} />
                  </Avatar>
                  <Box sx={{ textAlign: 'left', maxWidth: 120, overflow: 'hidden' }}>
                    <Typography noWrap sx={{ fontSize: 15, fontWeight: 600 }}>
                      {user.nombre}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: 13, color: '#2563eb', fontWeight: 500 }}>
                      {user.rol}
                    </Typography>
                  </Box>
                  <ArrowDropDown sx={{ color: '#2563eb' }} />
                </Box>

                <Menu
                  anchorEl={userAnchor}
                  open={Boolean(userAnchor)}
                  onClose={handleCloseUserMenu}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      boxShadow: '0 6px 24px rgba(34,51,107,0.12)',
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleCloseUserMenu();
                      logout();
                    }}
                    sx={{ color: '#e53935', fontWeight: 600 }}
                  >
                    <Logout sx={{ mr: 1 }} /> Cerrar sesión
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: { xs: 2, sm: 4 } }}>
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              p: { xs: 2, sm: 3 },
              minHeight: 600,
              borderRadius: 3,
              boxShadow: '0 4px 24px rgba(34,51,107,0.08)',
              bgcolor: '#fff',
            }}
          >
            {children}
          </Paper>
        </Box>

        <Box
          component="footer"
          sx={{
            position: 'fixed',
            left: 0,
            bottom: 0,
            width: '100%',
            textAlign: 'center',
            py: 1,
            fontSize: 14,
            fontWeight: 500,
            color: '#1e293b',
            borderTop: '1px solid #e0e3e7',
            bgcolor: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)',
            zIndex: 1201,
          }}
        >
          © {new Date().getFullYear()}{' '}
          <a
            href="https://www.tabix.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#22336b',
              fontWeight: 600,
              textDecoration: 'none',
            }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Tabix Group
          </a>. Todos los derechos reservados.
        </Box>
      </Box>
    </Box>
  );
}
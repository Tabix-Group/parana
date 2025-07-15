

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Paper, Divider, IconButton } from '@mui/material';
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
  return (
    <Box sx={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'Avenir, Helvetica, Arial, sans-serif' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#22336b', boxShadow: '0 2px 8px 0 rgba(34,51,107,0.08)' }}>
        <Toolbar sx={{ minHeight: 64, px: { xs: 1, sm: 3, md: 6 } }}>
          <IconButton edge="start" sx={{ mr: 2, color: '#22336b', p: 0.5 }}>
            <DashboardCustomizeOutlinedIcon fontSize="medium" />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1, color: '#22336b', fontFamily: 'Avenir, Helvetica, Arial, sans-serif', mr: 2 }}>
            </Typography>
            {menuItems.map(item => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  color: location.pathname === item.path ? '#1976d2' : '#22336b',
                  bgcolor: location.pathname === item.path ? 'rgba(25,118,210,0.08)' : 'transparent',
                  fontWeight: 500,
                  fontSize: '1rem',
                  px: 2,
                  py: 1.2,
                  borderRadius: 2,
                  boxShadow: location.pathname === item.path ? '0 2px 8px 0 rgba(25,118,210,0.08)' : 'none',
                  transition: 'all 0.18s',
                  '&:hover': {
                    bgcolor: 'rgba(25,118,210,0.12)',
                    color: '#1976d2',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
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

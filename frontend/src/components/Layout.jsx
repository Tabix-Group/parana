
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { label: 'Pedidos', path: '/pedidos-totales' },
  { label: 'Parciales', path: '/parciales' },
  { label: 'Devoluciones', path: '/devoluciones' },
  { label: 'Configuración', path: '/' },
];

export default function Layout({ children }) {
  const location = useLocation();
  return (
    <Box sx={{ minHeight: '100vh', background: '#fafbfc' }}>
      <AppBar position="static" sx={{ boxShadow: 2 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Seguimiento de Pedidos
          </Typography>
          {menuItems.map(item => (
            <Button
              key={item.path}
              color={location.pathname === item.path ? 'secondary' : 'inherit'}
              component={Link}
              to={item.path}
              sx={{ color: '#fff', mx: 1, borderBottom: location.pathname === item.path ? '2px solid #fff' : 'none' }}
            >
              {item.label}
            </Button>
          ))}
        </Toolbar>
      </AppBar>
      <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 4 }, py: 4, minHeight: 'calc(100vh - 80px)', boxSizing: 'border-box' }}>
        {children}
      </Box>
    </Box>
  );
}

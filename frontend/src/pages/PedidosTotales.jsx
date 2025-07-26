
import React from 'react';
import { Paper, Typography } from '@mui/material';
import Pedidos from '../components/Pedidos';

export default function PedidosTotales() {
  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0 4px 32px 0 rgba(34,51,107,0.08)', width: '100%', minHeight: 400 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>Pedidos Totales</Typography>
      <Pedidos />
    </Paper>
  );
}

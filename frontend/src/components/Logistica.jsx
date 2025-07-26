
import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box } from '@mui/material';

const columns = [
  { id: 'id', label: 'ID' },
  { id: 'cliente', label: 'Cliente' },
  { id: 'fecha', label: 'Fecha' },
  { id: 'estado', label: 'Estado' },
  { id: 'transporte', label: 'Transporte' },
];

const Logistica = ({ pedidos }) => (
  <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0 4px 32px 0 rgba(34,51,107,0.08)', width: '100%', minHeight: 400 }}>
    <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>Logística</Typography>
    <TableContainer sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)', border: '1px solid', borderColor: 'divider', background: 'background.paper' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: 16 }}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {pedidos && pedidos.length > 0 ? (
            pedidos.map((pedido) => (
              <TableRow key={pedido.id} sx={{ background: 'background.paper', '&:hover': { background: '#e8f0fe' } }}>
                {columns.map(col => (
                  <TableCell key={col.id}>{pedido[col.id]}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                No hay pedidos para mostrar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

export default Logistica;

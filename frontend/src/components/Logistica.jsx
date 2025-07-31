  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
import React, { useState, useEffect } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, TablePagination, TextField, FormControl, Select, MenuItem, Button } from '@mui/material';
import API from '../api';

const columns = [
  { id: 'comprobante', label: 'Comprobante' },
  { id: 'cliente', label: 'Cliente' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'cantidad', label: 'Cantidad' },
  { id: 'tipo', label: 'Tipo' },
  { id: 'fecha', label: 'Fecha' },
  { id: 'estado', label: 'Estado' },
  { id: 'transporte', label: 'Transporte' },
];

const pageSizes = [10, 15, 25, 50];

const Logistica = ({ pedidos }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ comprobante: '', cliente: '', fecha_entrega: '', estado: '', transporte: '' });
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [transportes, setTransportes] = useState([]);

  useEffect(() => {
    API.get('/clientes').then(res => setClientes(res.data.data));
    API.get('/estados').then(res => setEstados(res.data.data));
    API.get('/transportes').then(res => setTransportes(res.data.data));
  }, []);

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };
  const handleClearFilters = () => {
    setFilters({ comprobante: '', cliente: '', fecha_entrega: '', estado: '', transporte: '' });
    setPage(0);
  };

  // Filtrado frontend igual a Pedidos
  const filteredPedidos = pedidos.filter(p => {
    const matchComprobante = filters.comprobante === '' || (p.comprobante || '').toLowerCase().includes(filters.comprobante.toLowerCase());
    const matchCliente = filters.cliente === '' || String(p.cliente_id || p.cliente) === String(filters.cliente);
    const matchFecha = filters.fecha_entrega === '' || (p.fecha_entrega || p.fecha || '').startsWith(filters.fecha_entrega);
    const matchEstado = filters.estado === '' || String(p.estado_id || p.estado) === String(filters.estado);
    const matchTransporte = filters.transporte === '' || String(p.transporte_id || p.transporte) === String(filters.transporte);
    return matchComprobante && matchCliente && matchFecha && matchEstado && matchTransporte;
  });
  const paginatedPedidos = filteredPedidos.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <>
      {/* Filtros en una sola fila arriba de la tabla */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'center' }}>
        <TextField
          size="small"
          name="comprobante"
          value={filters.comprobante}
          onChange={handleFilter}
          placeholder="Comprobante"
          sx={{ minWidth: 120, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
        />
        <FormControl size="small" sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}>
          <Select name="cliente" value={filters.cliente} onChange={handleFilter} displayEmpty>
            <MenuItem value="">Cliente</MenuItem>
            {clientes.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          size="small"
          name="fecha_entrega"
          value={filters.fecha_entrega}
          onChange={handleFilter}
          type="date"
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
        />
        <FormControl size="small" sx={{ minWidth: 120, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}>
          <Select name="estado" value={filters.estado} onChange={handleFilter} displayEmpty>
            <MenuItem value="">Estado</MenuItem>
            {estados.map(e => <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}>
          <Select name="transporte" value={filters.transporte} onChange={handleFilter} displayEmpty>
            <MenuItem value="">Transporte</MenuItem>
            {transportes.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
          </Select>
        </FormControl>
        <Button onClick={handleClearFilters} sx={{ fontWeight: 500, px: 2, py: 1.2, borderRadius: 2 }}>Limpiar filtros</Button>
      </Box>
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
            {paginatedPedidos && paginatedPedidos.length > 0 ? (
              paginatedPedidos.map((pedido) => (
                <TableRow key={pedido.id} sx={{ background: 'background.paper', '&:hover': { background: '#e8f0fe' } }}>
                  {columns.map(col => {
                    if (col.id === 'tipo') {
                      return <TableCell key={col.id}>{pedido.tipo_bultos ? pedido.tipo_bultos : ''}</TableCell>;
                    }
                    if (col.id === 'direccion') {
                      return <TableCell key={col.id}>{pedido.direccion || ''}</TableCell>;
                    }
                    if (col.id === 'cantidad') {
                      return <TableCell key={col.id}>{pedido.cant_bultos ?? ''}</TableCell>;
                    }
                    if (col.id === 'comprobante') {
                      return <TableCell key={col.id}>{pedido.comprobante || ''}</TableCell>;
                    }
                    return <TableCell key={col.id}>{pedido[col.id]}</TableCell>;
                  })}
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
      <TablePagination
        component="div"
        count={pedidos.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={pageSizes}
        sx={{ mt: 2 }}
      />
    </>
  );
};

export default Logistica;

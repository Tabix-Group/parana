import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
  IconButton, Button, TextField, Select, MenuItem, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import API from '../api';

const columns = [
  { id: 'comprobante', label: 'Comprobante' },
  { id: 'cliente_nombre', label: 'Cliente' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'armador_nombre', label: 'Armador' },
  { id: 'tipo_transporte_nombre', label: 'Tipo Transporte' },
  { id: 'transporte_nombre', label: 'Transporte' },
  { id: 'vendedor_nombre', label: 'Vendedor' },
  { id: 'fecha_entrega', label: 'Fecha Entrega' },
  { id: 'estado_nombre', label: 'Estado' },
  { id: 'notas', label: 'Notas' },
  { id: 'acciones', label: 'Acciones' }
];

const pageSizes = [10, 15, 25, 50];

export default function Pedidos() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('id');
  const [order, setOrder] = useState('desc');
  const [filters, setFilters] = useState({ comprobante: '', cliente: '', estado: '' });
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ comprobante: '', cliente_id: '', direccion: '', armador_id: '', tipo_transporte_id: '', transporte_id: '', vendedor_id: '', fecha_entrega: '', estado_id: '', notas: '' });
  const [clientes, setClientes] = useState([]);
  const [armadores, setArmadores] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [tiposTransporte, setTiposTransporte] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [estados, setEstados] = useState([]);

  useEffect(() => {
    fetchData();
    fetchEntidades();
    // eslint-disable-next-line
  }, [page, pageSize, sortBy, order, filters]);

  const fetchData = async () => {
    const res = await API.get('/pedidos', {
      params: {
        page: page + 1,
        pageSize,
        sortBy,
        order,
        ...filters
      }
    });
    setData(res.data.data);
    setTotal(Number(res.data.total));
  };

  const fetchEntidades = async () => {
    const [cli, arm, tra, tipo, ven, est] = await Promise.all([
      API.get('/clientes'),
      API.get('/armadores'),
      API.get('/transportes'),
      API.get('/tipos-transporte'),
      API.get('/vendedores'),
      API.get('/estados')
    ]);
    setClientes(cli.data.data || cli.data);
    setArmadores(arm.data.data || arm.data);
    setTransportes(tra.data.data || tra.data);
    setTiposTransporte(tipo.data.data || tipo.data);
    setVendedores(ven.data.data || ven.data);
    setEstados(est.data.data || est.data);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
  const handleSort = col => {
    setSortBy(col);
    setOrder(order === 'asc' ? 'desc' : 'asc');
  };
  const handleFilter = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleOpen = (row = null) => {
    setEditRow(row);
    setForm(row ? { ...row } : { comprobante: '', cliente_id: '', direccion: '', armador_id: '', tipo_transporte_id: '', transporte_id: '', vendedor_id: '', fecha_entrega: '', estado_id: '', notas: '' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (editRow) {
      await API.put(`/pedidos/${editRow.id}`, form);
    } else {
      await API.post('/pedidos', form);
    }
    setOpen(false);
    fetchData();
  };

  const handleDelete = async id => {
    if (window.confirm('¿Borrar pedido?')) {
      await API.delete(`/pedidos/${id}`);
      fetchData();
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ mb: 2 }}>Nuevo Pedido</Button>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={col.id} onClick={() => col.id !== 'acciones' && handleSort(col.id)} style={{ cursor: col.id !== 'acciones' ? 'pointer' : 'default' }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell><TextField size="small" name="comprobante" value={filters.comprobante} onChange={handleFilter} placeholder="Buscar..." /></TableCell>
              <TableCell>
                <FormControl size="small" fullWidth>
                  <Select name="cliente" value={filters.cliente} onChange={handleFilter} displayEmpty>
                    <MenuItem value="">Todos</MenuItem>
                    {clientes.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell>
                <FormControl size="small" fullWidth>
                  <Select name="estado" value={filters.estado} onChange={handleFilter} displayEmpty>
                    <MenuItem value="">Todos</MenuItem>
                    {estados.map(e => <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(row => (
              <TableRow key={row.id}>
                {columns.map(col => (
                  col.id === 'acciones' ? (
                    <TableCell key={col.id}>
                      <IconButton onClick={() => handleOpen(row)}><Edit /></IconButton>
                      <IconButton onClick={() => handleDelete(row.id)}><Delete /></IconButton>
                    </TableCell>
                  ) : (
                    <TableCell key={col.id}>{row[col.id]}</TableCell>
                  )
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={pageSizes}
      />
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, mb: 1 }}>{editRow ? 'Editar Pedido' : 'Nuevo Pedido'}</DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2.2,
            alignItems: 'start',
            py: 0.5,
            background: '#f8fafc',
            borderRadius: 2,
            boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)',
            overflow: 'visible',
            mt: 0,
          }}
        >
          <TextField label="Comprobante" name="comprobante" value={form.comprobante} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Cliente</InputLabel>
            <Select name="cliente_id" value={form.cliente_id} onChange={handleChange} label="Cliente">
              {clientes.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Armador</InputLabel>
            <Select name="armador_id" value={form.armador_id} onChange={handleChange} label="Armador">
              {armadores.map(a => <MenuItem key={a.id} value={a.id}>{a.nombre} {a.apellido}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Tipo Transporte</InputLabel>
            <Select name="tipo_transporte_id" value={form.tipo_transporte_id} onChange={handleChange} label="Tipo Transporte">
              {tiposTransporte.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Transporte</InputLabel>
            <Select name="transporte_id" value={form.transporte_id} onChange={handleChange} label="Transporte">
              {transportes.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Vendedor</InputLabel>
            <Select name="vendedor_id" value={form.vendedor_id} onChange={handleChange} label="Vendedor">
              {vendedores.map(v => <MenuItem key={v.id} value={v.id}>{v.nombre} {v.apellido}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Fecha Entrega" name="fecha_entrega" type="date" value={form.fecha_entrega} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Estado</InputLabel>
            <Select name="estado_id" value={form.estado_id} onChange={handleChange} label="Estado">
              {estados.map(e => <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Notas" name="notas" value={form.notas} onChange={handleChange} fullWidth multiline rows={2} InputLabelProps={{ shrink: true }} sx={{ gridColumn: { md: '1/3' }, bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined" color="secondary" sx={{ minWidth: 120, fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ minWidth: 120, fontWeight: 600, ml: 2 }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

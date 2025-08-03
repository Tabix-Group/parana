import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
  IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Box
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import API from '../api';

const columns = [
  { id: 'Codigo', label: 'Código' },
  { id: 'nombre', label: 'Nombre' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'localidad', label: 'Localidad' },
  { id: 'telefono', label: 'Teléfono' },
  { id: 'acciones', label: 'Acciones' }
];
const pageSizes = [10, 15, 25, 50];

export default function Clientes() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('id');
  const [order, setOrder] = useState('desc');
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ nombre: '', direccion: '', localidad: '', telefono: '', Codigo: '' });

  useEffect(() => { fetchData(); }, [page, pageSize, sortBy, order, filter]);

  const fetchData = async () => {
    const res = await API.get('/clientes', {
      params: { page: page + 1, pageSize, sortBy, order, nombre: filter }
    });
    setData(res.data.data);
    setTotal(Number(res.data.total));
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
  const handleSort = col => { setSortBy(col); setOrder(order === 'asc' ? 'desc' : 'asc'); };
  const handleOpen = (row = null) => { setEditRow(row); setForm(row ? { ...row } : { nombre: '', direccion: '', localidad: '', telefono: '', Codigo: '' }); setOpen(true); };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async () => { if (editRow) { await API.put(`/clientes/${editRow.id}`, form); } else { await API.post('/clientes', form); } setOpen(false); fetchData(); };
  const handleDelete = async id => { if (window.confirm('¿Borrar cliente?')) { await API.delete(`/clientes/${id}`); fetchData(); } };

  return (
    <Paper sx={{ p: { xs: 1, sm: 2 }, boxShadow: '0 4px 32px 0 rgba(34,51,107,0.10)', borderRadius: 3, border: '1.5px solid #e0e3e7', background: '#fff' }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          sx={{ fontWeight: 700, px: 2.5, py: 1.2, borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(34,51,107,0.10)' }}
        >
          Nuevo Cliente
        </Button>
        <TextField size="small" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar por nombre..." sx={{ bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }} />
      </Box>
      <TableContainer sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)', border: '1px solid #e0e3e7', background: '#fff' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ background: '#f6f8fa' }}>
              {columns.map(col => {
                let cellSx = {
                  cursor: col.id !== 'acciones' ? 'pointer' : 'default',
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#22336b',
                  borderBottom: '2px solid #e0e3e7',
                  background: '#f6f8fa',
                  letterSpacing: 0.2
                };
                if (col.id === 'direccion') cellSx = { ...cellSx, minWidth: 180, width: 220, maxWidth: 300 };
                return (
                  <TableCell
                    key={col.id}
                    onClick={() => col.id !== 'acciones' ? handleSort(col.id) : undefined}
                    sx={cellSx}
                  >
                    {col.label}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.filter(row => (row.nombre || '').toLowerCase().includes((filter || '').toLowerCase())).map((row, idx) => (
              <TableRow
                key={row.id}
                sx={{
                  background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                  transition: 'background 0.18s',
                  '&:hover': { background: '#e8f0fe' }
                }}
              >
                {columns.map(col => {
                  let cellSx = { fontSize: 15, color: '#22336b', py: 1.2, px: 1.5 };
                  if (col.id === 'direccion') cellSx = { ...cellSx, minWidth: 180, width: 220, maxWidth: 300 };
                  if (col.id === 'acciones') cellSx = { minWidth: 90, textAlign: 'center' };
                  return col.id === 'acciones' ? (
                    <TableCell key={col.id} sx={cellSx}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <IconButton onClick={() => handleOpen(row)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#e8f0fe' }, p: 0.7 }} size="small"><Edit fontSize="small" /></IconButton>
                        <IconButton onClick={() => handleDelete(row.id)} sx={{ color: '#e53935', '&:hover': { bgcolor: '#fdeaea' }, p: 0.7 }} size="small"><Delete fontSize="small" /></IconButton>
                      </Box>
                    </TableCell>
                  ) : (
                    <TableCell key={col.id} sx={cellSx}>{row[col.id]}</TableCell>
                  );
                })}
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
        sx={{ mt: 2 }}
      />
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, mb: 1 }}>{editRow ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
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
          <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
          <TextField label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
          <TextField label="Localidad" name="localidad" value={form.localidad} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
          <TextField label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
          <TextField label="Código" name="Codigo" type="number" value={form.Codigo} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined" color="secondary" sx={{ minWidth: 120, fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ minWidth: 120, fontWeight: 600, ml: 2 }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

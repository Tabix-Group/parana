import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
  IconButton, Button, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import API from '../api';

const columns = [
  { id: 'pedido_id', label: 'Pedido' },
  { id: 'tipo', label: 'Tipo' },
  { id: 'recibido', label: 'Recibido' },
  { id: 'fecha', label: 'Fecha' },
  { id: 'acciones', label: 'Acciones' }
];
const pageSizes = [10, 15, 25, 50];

export default function Devoluciones() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ pedido_id: '', tipo: '', recibido: false, fecha: '' });
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => { fetchData(); fetchPedidos(); }, [page, pageSize]);

  const fetchData = async () => {
    const res = await API.get('/devoluciones', {
      params: { page: page + 1, pageSize }
    });
    setData(res.data.data);
    setTotal(Number(res.data.total));
  };
  const fetchPedidos = async () => {
    const res = await API.get('/pedidos');
    setPedidos(res.data.data || res.data);
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
  const handleOpen = (row = null) => { setEditRow(row); setForm(row ? { ...row } : { pedido_id: '', tipo: '', recibido: false, fecha: '' }); setOpen(true); };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async () => { if (editRow) { await API.put(`/devoluciones/${editRow.id}`, form); } else { await API.post('/devoluciones', form); } setOpen(false); fetchData(); };
  const handleDelete = async id => { if (window.confirm('¿Borrar devolución?')) { await API.delete(`/devoluciones/${id}`); fetchData(); } };

  return (
    <Paper sx={{ p: 2 }}>
      <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ mb: 2 }}>Nueva Devolución</Button>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={col.id}>{col.label}</TableCell>
              ))}
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
                  ) : col.id === 'recibido' ? (
                    <TableCell key={col.id}>{row.recibido ? 'Sí' : 'No'}</TableCell>
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
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow ? 'Editar Devolución' : 'Nueva Devolución'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Pedido</InputLabel>
            <Select name="pedido_id" value={form.pedido_id} onChange={handleChange} label="Pedido">
              {pedidos.map(p => <MenuItem key={p.id} value={p.id}>{p.comprobante}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select name="tipo" value={form.tipo} onChange={handleChange} label="Tipo">
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="material">Material</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Recibido</InputLabel>
            <Select name="recibido" value={form.recibido} onChange={handleChange} label="Recibido">
              <MenuItem value={true}>Sí</MenuItem>
              <MenuItem value={false}>No</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Fecha" name="fecha" type="date" value={form.fecha} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
  IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import API from '../api';

const columns = [
  { id: 'nombre', label: 'Nombre' },
  { id: 'apellido', label: 'Apellido' },
  { id: 'acciones', label: 'Acciones' }
];
const pageSizes = [10, 15, 25, 50];

export default function Armadores() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('id');
  const [order, setOrder] = useState('desc');
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '' });

  useEffect(() => { fetchData(); }, [page, pageSize, sortBy, order, filter]);

  const fetchData = async () => {
    const res = await API.get('/armadores', {
      params: { page: page + 1, pageSize, sortBy, order, nombre: filter }
    });
    setData(res.data.data);
    setTotal(Number(res.data.total));
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
  const handleSort = col => { setSortBy(col); setOrder(order === 'asc' ? 'desc' : 'asc'); };
  const handleOpen = (row = null) => { setEditRow(row); setForm(row ? { ...row } : { nombre: '', apellido: '' }); setOpen(true); };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async () => { if (editRow) { await API.put(`/armadores/${editRow.id}`, form); } else { await API.post('/armadores', form); } setOpen(false); fetchData(); };
  const handleDelete = async id => { if (window.confirm('¿Borrar armador?')) { await API.delete(`/armadores/${id}`); fetchData(); } };

  return (
    <Paper sx={{ p: 2 }}>
      <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ mb: 2 }}>Nuevo Armador</Button>
      <TextField size="small" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar por nombre..." sx={{ mb: 2, ml: 2 }} />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={col.id} onClick={() => col.id !== 'acciones' && handleSort(col.id)} style={{ cursor: col.id !== 'acciones' ? 'pointer' : 'default' }}>{col.label}</TableCell>
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
        <DialogTitle>{editRow ? 'Editar Armador' : 'Nuevo Armador'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} fullWidth />
          <TextField label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

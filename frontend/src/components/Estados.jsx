import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
  IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import API from '../api';

const columns = [
  { id: 'nombre', label: 'Nombre' },
  { id: 'acciones', label: 'Acciones' }
];
const pageSizes = [10, 15, 25, 50];

export default function Estados() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('id');
  const [order, setOrder] = useState('desc');
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ nombre: '' });

  useEffect(() => { fetchData(); }, [page, pageSize, sortBy, order, filter]);

  const fetchData = async () => {
    const res = await API.get('/estados', {
      params: { page: page + 1, pageSize, sortBy, order, nombre: filter }
    });
    setData(res.data.data);
    setTotal(Number(res.data.total));
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
  const handleSort = col => { setSortBy(col); setOrder(order === 'asc' ? 'desc' : 'asc'); };
  const handleOpen = (row = null) => { setEditRow(row); setForm(row ? { ...row } : { nombre: '' }); setOpen(true); };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async () => { if (editRow) { await API.put(`/estados/${editRow.id}`, form); } else { await API.post('/estados', form); } setOpen(false); fetchData(); };
  const handleDelete = async id => { if (window.confirm('¿Borrar estado?')) { await API.delete(`/estados/${id}`); fetchData(); } };

  return (
    <Paper sx={{ p: 2 }}>
      <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ mb: 2 }}>Nuevo Estado</Button>
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
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, mb: 1 }}>{editRow ? 'Editar Estado' : 'Nuevo Estado'}</DialogTitle>
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
          <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, gridColumn: { md: '1/3' }, mt: 0, mb: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined" color="secondary" sx={{ minWidth: 120, fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ minWidth: 120, fontWeight: 600, ml: 2 }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

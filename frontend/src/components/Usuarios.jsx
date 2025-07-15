import React, { useEffect, useState } from 'react';
import { Paper, Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import API from '../api';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'logistica', label: 'Logística' }
];

export default function Usuarios() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ nombre: '', mail: '', clave: '', rol: '' });

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const fetchData = () => {
    API.get('/usuarios', { params: { page: page + 1, pageSize } }).then(res => {
      if (Array.isArray(res.data)) {
        setData(res.data);
        setTotal(res.data.length);
      } else if (res.data && Array.isArray(res.data.data)) {
        setData(res.data.data);
        setTotal(Number(res.data.total) || res.data.data.length);
      } else {
        setData([]);
        setTotal(0);
      }
    });
  };

  const handleOpen = (row = null) => {
    setEditRow(row);
    setForm(row ? { ...row } : { nombre: '', mail: '', clave: '', rol: '' });
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setEditRow(null);
    setForm({ nombre: '', mail: '', clave: '', rol: '' });
  };
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleSave = () => {
    if (editRow) {
      API.put(`/usuarios/${editRow.id}`, form).then(() => { fetchData(); handleClose(); });
    } else {
      API.post('/usuarios', form).then(() => { fetchData(); handleClose(); });
    }
  };
  const handleDelete = id => {
    if (window.confirm('¿Borrar usuario?')) {
      API.delete(`/usuarios/${id}`).then(() => fetchData());
    }
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };

  return (
    <Paper sx={{ p: { xs: 1, sm: 2 }, boxShadow: '0 4px 32px 0 rgba(34,51,107,0.10)', borderRadius: 3, border: '1.5px solid #e0e3e7', background: '#fff' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ fontWeight: 700, px: 2.5, py: 1.2, borderRadius: 2 }}>Nuevo Usuario</Button>
      </Box>
      <TableContainer sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)', border: '1px solid #e0e3e7', background: '#fff' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ background: '#f6f8fa' }}>
              <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mail</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(page * pageSize, page * pageSize + pageSize).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.nombre}</TableCell>
                <TableCell>{row.mail}</TableCell>
                <TableCell>{roles.find(r => r.value === row.rol)?.label || row.rol}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpen(row)} color="primary"><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(row.id)} color="error"><Delete /></IconButton>
                </TableCell>
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
        rowsPerPageOptions={[10, 15, 25, 50]}
        sx={{ mt: 2 }}
      />
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
          <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} fullWidth />
          <TextField label="Mail" name="mail" value={form.mail} onChange={handleChange} fullWidth />
          <TextField label="Clave" name="clave" value={form.clave} onChange={handleChange} fullWidth type="password" />
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select name="rol" value={form.rol} label="Rol" onChange={handleChange}>
              {roles.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

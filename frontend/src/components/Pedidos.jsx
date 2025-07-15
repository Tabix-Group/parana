import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
  IconButton, Button, TextField, Select, MenuItem, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, Menu, Box
} from '@mui/material';
import { Edit, Delete, Add, FileDownload } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import API from '../api';

const columns = [
  { id: 'comprobante', label: 'Comprobante' },
  { id: 'cliente_nombre', label: 'Cliente' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'armador_nombre', label: 'Armador' },
  { id: 'tipo_transporte_nombre', label: 'Tipo Tte' },
  { id: 'transporte_nombre', label: 'Transporte' },
  { id: 'vendedor_nombre', label: 'Vendedor' },
  { id: 'fecha_entrega', label: 'Fecha Entrega' },
  { id: 'estado_nombre', label: 'Estado' },
  { id: 'notas', label: 'Notas' },
  { id: 'acciones', label: 'Acciones' }
];

const pageSizes = [10, 15, 25, 50];

export default function Pedidos() {
  // Estado para el diálogo de edición/alta
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({
    comprobante: '',
    cliente_id: '',
    direccion: '',
    armador_id: '',
    tipo_transporte_id: '',
    transporte_id: '',
    vendedor_id: '',
    fecha_entrega: '',
    estado_id: '',
    notas: ''
  });

  // Abrir diálogo para nuevo o editar
  const handleOpen = (row = null) => {
    setEditRow(row);
    setForm(row ? {
      comprobante: row.comprobante || '',
      cliente_id: row.cliente_id || '',
      direccion: row.direccion || '',
      armador_id: row.armador_id || '',
      tipo_transporte_id: row.tipo_transporte_id || '',
      transporte_id: row.transporte_id || '',
      vendedor_id: row.vendedor_id || '',
      fecha_entrega: row.fecha_entrega || '',
      estado_id: row.estado_id || '',
      notas: row.notas || ''
    } : {
      comprobante: '', cliente_id: '', direccion: '', armador_id: '', tipo_transporte_id: '', transporte_id: '', vendedor_id: '', fecha_entrega: '', estado_id: '', notas: ''
    });
    setOpen(true);
  };

  // Cerrar diálogo
  const handleClose = () => {
    setOpen(false);
    setEditRow(null);
    setForm({ comprobante: '', cliente_id: '', direccion: '', armador_id: '', tipo_transporte_id: '', transporte_id: '', vendedor_id: '', fecha_entrega: '', estado_id: '', notas: '' });
  };

  // Manejar cambios en el form
  const handleChange = e => {
    const { name, value } = e.target;
    // Si cambia el cliente, autocompletar dirección si existe
    if (name === 'cliente_id') {
      const cliente = clientes.find(c => String(c.id) === String(value));
      setForm(prev => ({
        ...prev,
        cliente_id: value,
        direccion: cliente && cliente.direccion ? cliente.direccion : ''
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Guardar pedido (alta o edición)
  const handleSubmit = async () => {
    if (editRow) {
      await API.put(`/pedidos/${editRow.id}`, form);
    } else {
      await API.post('/pedidos', form);
    }
    setOpen(false);
    setEditRow(null);
    setForm({ comprobante: '', cliente_id: '', direccion: '', armador_id: '', tipo_transporte_id: '', transporte_id: '', vendedor_id: '', fecha_entrega: '', estado_id: '', notas: '' });
    // Refrescar datos
    API.get('/pedidos', {
      params: {
        ...filters,
        page: page + 1,
        pageSize
      }
    }).then(res => {
      setData(res.data.data);
      setTotal(Number(res.data.total) || 0);
    });
  };

  // Eliminar pedido
  const handleDelete = async id => {
    if (window.confirm('¿Borrar pedido?')) {
      await API.delete(`/pedidos/${id}`);
      // Refrescar datos
      API.get('/pedidos', {
        params: {
          ...filters,
          page: page + 1,
          pageSize
        }
      }).then(res => {
        setData(res.data.data);
        setTotal(Number(res.data.total) || 0);
      });
    }
  };
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);


  // Filtros debe ir antes de cualquier uso
  const [filters, setFilters] = useState({
    comprobante: '',
    cliente: '',
    fecha_entrega: '',
    estado: ''
  });
  const [total, setTotal] = useState(0);

  // Cargar datos de pedidos con filtros y paginación
  useEffect(() => {
    API.get('/pedidos', {
      params: {
        ...filters,
        page: page + 1,
        pageSize
      }
    }).then(res => {
      setData(res.data.data);
      setTotal(Number(res.data.total) || 0);
    });
  }, [filters, page, pageSize]);

  // Handlers de paginación
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };

  // Catálogos para selects
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [armadores, setArmadores] = useState([]);
  const [tiposTransporte, setTiposTransporte] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [vendedores, setVendedores] = useState([]);

  // Cargar catálogos al montar
  useEffect(() => {
    API.get('/clientes').then(res => setClientes(res.data.data));
    API.get('/estados').then(res => setEstados(res.data.data));
    API.get('/armadores').then(res => setArmadores(res.data.data));
    API.get('/tipos-transporte').then(res => setTiposTransporte(res.data.data));
    API.get('/transportes').then(res => setTransportes(res.data.data));
    API.get('/vendedores').then(res => setVendedores(res.data.data));
  }, []);
  // Maneja los cambios en los filtros de la tabla
  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Función para limpiar los filtros
  const handleClearFilters = () => {
    setFilters({ comprobante: '', cliente: '', fecha_entrega: '', estado: '' });
  };
  const [data, setData] = useState([]);
  // ...aquí van los hooks y lógica existentes...
  // El único return debe estar al final de la función Pedidos

  // Exportar a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const exportData = data.map(row =>
      columns.filter(c => c.id !== 'acciones').map(col => row[col.id])
    );
    doc.autoTable({
      head: [columns.filter(c => c.id !== 'acciones').map(col => col.label)],
      body: exportData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34,51,107] }
    });
    const fecha = new Date().toISOString().slice(0,10);
    doc.save(`PedidosTotales_${fecha}.pdf`);
  };

  const [exportAnchor, setExportAnchor] = React.useState(null);
  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  return (
    <Paper sx={{ p: { xs: 1, sm: 2 }, boxShadow: '0 4px 32px 0 rgba(34,51,107,0.10)', borderRadius: 3, border: '1.5px solid #e0e3e7', background: '#fff' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{ fontWeight: 700, px: 2.5, py: 1.2, borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(34,51,107,0.10)' }}
          >
            Nuevo Pedido
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExportClick}
            sx={{ fontWeight: 600, px: 2.5, py: 1.2, borderRadius: 2 }}
          >
            Exportar
          </Button>
          <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={handleExportClose}>
            <MenuItem onClick={() => { handleExportExcel(); handleExportClose(); }}>Exportar a Excel</MenuItem>
            <MenuItem onClick={() => { handleExportPDF(); handleExportClose(); }}>Exportar a PDF</MenuItem>
          </Menu>
        </Box>
        <Button
          variant="text"
          color="secondary"
          onClick={handleClearFilters}
          sx={{ fontWeight: 500, px: 2, py: 1.2, borderRadius: 2 }}
        >
          Limpiar filtros
        </Button>
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
                if (col.id === 'comprobante') cellSx = { ...cellSx, minWidth: 0, width: '1%', whiteSpace: 'nowrap', maxWidth: 120 };
                if (col.id === 'direccion') cellSx = { ...cellSx, minWidth: 180, width: 220, maxWidth: 300 };
                if (col.id === 'notas') cellSx = { ...cellSx, minWidth: 180, width: 260, maxWidth: 400 };
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
            <TableRow>
              <TableCell>
                <TextField size="small" name="comprobante" value={filters.comprobante} onChange={handleFilter} placeholder="Buscar..." sx={{ bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }} />
              </TableCell>
              <TableCell>
                <FormControl size="small" fullWidth sx={{ bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}>
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
              <TableCell>
                <TextField
                  size="small"
                  name="fecha_entrega"
                  value={filters.fecha_entrega}
                  onChange={handleFilter}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{ bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
                />
              </TableCell>
              <TableCell>
                <FormControl size="small" fullWidth sx={{ bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}>
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
            {data.map((row, idx) => (
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
                  if (col.id === 'comprobante') cellSx = { ...cellSx, minWidth: 0, width: '1%', whiteSpace: 'nowrap', maxWidth: 120 };
                  if (col.id === 'direccion') cellSx = { ...cellSx, minWidth: 180, width: 220, maxWidth: 300 };
                  if (col.id === 'notas') cellSx = { ...cellSx, minWidth: 180, width: 260, maxWidth: 400, whiteSpace: 'pre-line', wordBreak: 'break-word' };
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
            <InputLabel shrink>Tipo Tte</InputLabel>
            <Select name="tipo_transporte_id" value={form.tipo_transporte_id} onChange={handleChange} label="Tipo Tte">
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

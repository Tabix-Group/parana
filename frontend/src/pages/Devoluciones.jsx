import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
  IconButton, Button, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Box, Menu
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ pedido_id: '', tipo: '', recibido: false, fecha: '' });
  const [pedidos, setPedidos] = useState([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchData(); fetchPedidos(); }, [page, pageSize, filter]);

  const fetchData = async () => {
    const res = await API.get('/devoluciones', {
      params: { page: page + 1, pageSize, filter }
    });
    setData(res.data.data);
    setTotal(Number(res.data.total));
  };
  const fetchPedidos = async () => {
    const res = await API.get('/pedidos');
    setPedidos(res.data.data);
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
  const handleOpen = (row = null) => { setEditRow(row); setForm(row ? { ...row } : { pedido_id: '', tipo: '', recibido: false, fecha: '' }); setOpen(true); };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async () => { if (editRow) { await API.put(`/devoluciones/${editRow.id}`, form); } else { await API.post('/devoluciones', form); } setOpen(false); fetchData(); };
  const handleDelete = async id => { if (window.confirm('¿Borrar devolución?')) { await API.delete(`/devoluciones/${id}`); fetchData(); } };

  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = data.map(row => {
      const obj = {};
      columns.filter(c => c.id !== 'acciones').forEach(col => {
        obj[col.label] = row[col.id];
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Devoluciones');
    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `Devoluciones_${fecha}.xlsx`);
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const exportData = data.map(row =>
      columns.filter(c => c.id !== 'acciones').map(col => col.id === 'recibido' ? (row[col.id] ? 'Sí' : 'No') : row[col.id])
    );
    doc.autoTable({
      head: [columns.filter(c => c.id !== 'acciones').map(col => col.label)],
      body: exportData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34,51,107] }
    });
    const fecha = new Date().toISOString().slice(0,10);
    doc.save(`Devoluciones_${fecha}.pdf`);
  };

  const [exportAnchor, setExportAnchor] = React.useState(null);
  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  return (
    <Box>
      {/* Título ahora en AppBar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Nueva Devolución</Button>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleExportClick}
        >
          Exportar
        </Button>
        <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={handleExportClose}>
          <MenuItem onClick={() => { handleExportExcel(); handleExportClose(); }}>Exportar a Excel</MenuItem>
          <MenuItem onClick={() => { handleExportPDF(); handleExportClose(); }}>Exportar a PDF</MenuItem>
        </Menu>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar..."
          style={{ padding: 8, borderRadius: 6, border: '1px solid #d0d7e2', minWidth: 220 }}
        />
      </Box>
      <TableContainer sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)', border: '1px solid #e0e3e7', background: '#fff' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ background: '#f6f8fa' }}>
              {columns.map(col => {
                let cellSx = {
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
                if (col.id === 'acciones') cellSx = { minWidth: 90, textAlign: 'center' };
                return (
                  <TableCell key={col.id} sx={cellSx}>{col.label}</TableCell>
                );
              })}
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
                  ) : col.id === 'recibido' ? (
                    <TableCell key={col.id} sx={cellSx}>{row.recibido ? 'Sí' : 'No'}</TableCell>
                  ) : (
                    <TableCell key={col.id} sx={cellSx}>{row[col.id]}</TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Pedido</InputLabel>
            <Select name="pedido_id" value={form.pedido_id} onChange={handleChange} label="Pedido">
              {pedidos.map(p => <MenuItem key={p.id} value={p.id}>{p.comprobante}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Tipo</InputLabel>
            <Select name="tipo" value={form.tipo} onChange={handleChange} label="Tipo">
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="material">Material</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Recibido</InputLabel>
            <Select name="recibido" value={form.recibido} onChange={handleChange} label="Recibido">
              <MenuItem value={true}>Sí</MenuItem>
              <MenuItem value={false}>No</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Fecha" name="fecha" type="date" value={form.fecha} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined" color="secondary" sx={{ minWidth: 120, fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ minWidth: 120, fontWeight: 600, ml: 2 }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}




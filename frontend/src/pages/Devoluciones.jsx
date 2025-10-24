import React, { useEffect, useState } from 'react';
import { Autocomplete } from '@mui/material';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
  IconButton, Button, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Box, Menu, Typography, Checkbox
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Edit, Delete, Add } from '@mui/icons-material';
import API from '../api';

// Función para formatear fechas a dd/mm/yy sin problemas de zona horaria
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    // Si ya está en formato YYYY-MM-DD, parsearlo directamente
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year.slice(-2)}`;
    }
    
    // Si es un timestamp ISO, extraer solo la parte de la fecha
    if (typeof dateString === 'string' && dateString.includes('T')) {
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year.slice(-2)}`;
    }
    
    // Para otros formatos, intentar parsear pero sin zona horaria
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return '';
  }
};

const columns = [
  { id: 'pedido_id', label: 'Pedido' },
  { id: 'Codigo', label: 'Código' },
  { id: 'cliente_id', label: 'Cliente' },
  { id: 'transporte_id', label: 'Transporte' },
  { id: 'tipo', label: 'Tipo' },
  { id: 'recibido', label: 'Recibido' },
  { id: 'fecha_pedido', label: 'Fecha Pedido' },
  { id: 'fecha', label: 'Fecha Entrega' },
  { id: 'texto', label: 'Observaciones', sx: { minWidth: 540, width: 600, maxWidth: 900 } },
  { id: 'acciones', label: 'Acciones' },
  { id: 'en_logistica', label: 'En Logística' }
];

const pageSizes = [10, 15, 25, 50, 100];

export default function Devoluciones() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ pedido_id: null, Codigo: '', cliente_id: null, transporte_id: null, tipo: '', recibido: false, fecha: '', texto: '', fecha_pedido: '' });
  const [pedidos, setPedidos] = useState([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [clientes, setClientes] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);

  useEffect(() => { fetchData(); fetchPedidos(); fetchClientes(); fetchTransportes(); }, [page, pageSize, filter]);
  const fetchTransportes = async () => {
    const res = await API.get('/transportes', { params: { pageSize: 10000 } });
    setTransportes(res.data.data);
  };
  const fetchClientes = async () => {
    const res = await API.get('/clientes', { params: { pageSize: 10000 } });
    setClientes(res.data.data);
  };

  const fetchData = async () => {
    const res = await API.get('/devoluciones', {
      params: { page: page + 1, pageSize, filter }
    });
    setData(res.data.data);
    setTotal(Number(res.data.total));
  };
  const fetchPedidos = async () => {
    const res = await API.get('/pedidos', { params: { pageSize: 10000 } });
    setPedidos(res.data.data);
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
  const handleOpen = (row = null) => {
    setEditRow(row);
    // Si es una nueva devolución, establecer fecha_pedido con la fecha actual
    const fechaHoy = new Date().toISOString().split('T')[0];
    setForm(row ? { ...row } : { 
      pedido_id: null, 
      Codigo: '', 
      cliente_id: null, 
      transporte_id: null, 
      tipo: '', 
      recibido: false, 
      fecha: '', 
      fecha_pedido: fechaHoy, // Fecha actual por defecto
      texto: '', 
      en_logistica: false 
    });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = e => {
    const { name, value, checked, type } = e.target;
    if (name === 'Codigo') {
      setForm(prev => ({ ...prev, Codigo: value }));
      if (value && value.trim() !== '' && /^[0-9]+$/.test(value)) {
        setClientesLoading(true);
        API.get('/clientes', { params: { Codigo: value, pageSize: 5 } })
          .then(res => {
            const cliente = res.data.data && res.data.data.length > 0 ? res.data.data[0] : null;
            if (cliente) {
              setForm(prev => ({
                ...prev,
                cliente_id: cliente.id,
                Codigo: cliente.Codigo || value,
              }));
              setClientes([cliente]);
            } else {
              setForm(prev => ({ ...prev, cliente_id: null }));
            }
          })
          .catch(error => {
            console.error('Error buscando cliente:', error);
          })
          .finally(() => setClientesLoading(false));
      } else if (value === '') {
        setForm(prev => ({ ...prev, cliente_id: null }));
        setClientes([]);
      }
    } else if (name === 'cliente_id') {
      const cliente = clientes.find(c => String(c.id) === String(value));
      setForm(prev => ({
        ...prev,
        cliente_id: value,
        Codigo: cliente && cliente.Codigo ? cliente.Codigo : '',
      }));
    } else if (type === 'checkbox') {
      // Manejar checkbox
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };
  const handleSubmit = async () => {
    console.log('Form completo antes de enviar:', form);
    console.log('pedido_id específicamente:', form.pedido_id, 'tipo:', typeof form.pedido_id);
    
    // Enviar los datos directamente, el backend se encargará de limpiarlos
    const dataToSend = {
      ...form
    };
    
    console.log('Datos enviando al backend:', dataToSend);
    
    try {
      if (editRow) {
        await API.put(`/devoluciones/${editRow.id}`, dataToSend);
      } else {
        await API.post('/devoluciones', dataToSend);
      }
      setOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error al guardar devolución:', error);
      alert('Error al guardar: ' + (error.response?.data?.error || error.message));
    }
  };
  const handleDelete = async id => { if (window.confirm('¿Borrar devolución?')) { await API.delete(`/devoluciones/${id}`); fetchData(); } };

  // Manejar cambio de estado en logística para devoluciones
  const handleLogisticaToggle = async (id, checked) => {
    try {
      await API.put(`/devoluciones/${id}/logistica`, { en_logistica: checked });
      fetchData();
    } catch (error) {
      console.error('Error al cambiar estado de logística:', error);
      alert('Error al cambiar el estado: ' + (error.response?.data?.message || error.message));
    }
  };

  // Manejar cambio de estado "recibido"
  const handleRecibidoToggle = async (id, checked) => {
    try {
      await API.put(`/devoluciones/${id}/recibido`, { recibido: checked });
      fetchData();
    } catch (error) {
      console.error('Error al cambiar estado de recibido:', error);
      alert('Error al cambiar el estado: ' + (error.response?.data?.message || error.message));
    }
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = data.map(row => {
      const obj = {};
      columns.filter(c => c.id !== 'acciones' && c.id !== 'en_logistica').forEach(col => {
        if (col.id === 'fecha') {
          obj[col.label] = formatDate(row[col.id]);
        } else {
          obj[col.label] = row[col.id];
        }
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
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('Devoluciones', 10, 15);
    
    const exportData = data.map(row => {
      return columns.filter(c => c.id !== 'acciones' && c.id !== 'en_logistica').map(col => {
        if (col.id === 'fecha') {
          return formatDate(row[col.id]);
        }
        if (col.id === 'recibido') {
          return row[col.id] ? 'Sí' : 'No';
        }
        return row[col.id] || '';
      });
    });
    
    const headers = columns.filter(c => c.id !== 'acciones' && c.id !== 'en_logistica').map(col => col.label);
    
    doc.autoTable({
      head: [headers],
      body: exportData,
      startY: 25,
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 30 }, // ID
        1: { cellWidth: 35 }, // Fecha
        2: { cellWidth: 40 }, // Cliente
        3: { cellWidth: 40 }, // Vendedor
        4: { cellWidth: 40 }, // Armador
        5: { cellWidth: 35 }, // Estado
        6: { cellWidth: 45 }, // Motivo
        7: { cellWidth: 40 }, // Observaciones
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      }
    });
    
    const fecha = new Date().toISOString().slice(0,10);
    doc.save(`Devoluciones_${fecha}.pdf`);
  };

  const [exportAnchor, setExportAnchor] = React.useState(null);
  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Nuevo Cobro/Devolución</Button>
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
                  fontSize: 11,
                  color: '#22336b',
                  borderBottom: '2px solid #e0e3e7',
                  background: '#f6f8fa',
                  letterSpacing: 0.2,
                  py: 0.6,
                  textAlign: 'left'
                };
                if (col.id === 'comprobante') cellSx = { ...cellSx, minWidth: 0, width: '1%', whiteSpace: 'nowrap', maxWidth: 100 };
                if (col.id === 'direccion') cellSx = { ...cellSx, minWidth: 120, width: 150, maxWidth: 200 };
                if (col.id === 'notas') cellSx = { ...cellSx, minWidth: 120, width: 180, maxWidth: 250 };
                if (col.id === 'acciones') cellSx = { minWidth: 70, textAlign: 'center' };
                if (col.id === 'en_logistica') cellSx = { ...cellSx, minWidth: 60, width: 70, maxWidth: 80, textAlign: 'center' };
                return (
                  <TableCell key={col.id} sx={cellSx}>{col.label}</TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => {
              return (
                <TableRow
                  key={row.id}
                  sx={{
                    background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                    transition: 'background 0.18s',
                    '&:hover': { background: '#e8f0fe' }
                  }}
                >
                  {columns.map(col => {
                    let cellSx = { fontSize: 10, color: '#22336b', py: 0.4, px: 0.6, textAlign: 'left' };
                    if (col.id === 'comprobante') cellSx = { ...cellSx, minWidth: 0, width: '1%', whiteSpace: 'nowrap', maxWidth: 100 };
                    if (col.id === 'direccion') cellSx = { ...cellSx, minWidth: 120, width: 150, maxWidth: 200 };
                    if (col.id === 'notas') cellSx = { ...cellSx, minWidth: 120, width: 180, maxWidth: 250, whiteSpace: 'pre-line', wordBreak: 'break-word' };
                    if (col.id === 'texto') cellSx = { ...cellSx, minWidth: 300, width: 400, maxWidth: 600, whiteSpace: 'pre-line', wordBreak: 'break-word' };
                    if (col.id === 'acciones') cellSx = { ...cellSx, minWidth: 70, textAlign: 'center' };
                    if (col.id === 'en_logistica') cellSx = { ...cellSx, minWidth: 60, width: 70, maxWidth: 80, textAlign: 'center' };
                    if (col.id === 'pedido_id') {
                      // Buscar el comprobante del pedido - comparar con conversión a número para evitar problemas de tipos
                      const pedido = pedidos.find(p => Number(p.id) === Number(row.pedido_id));
                      console.log('Buscando pedido:', { row_pedido_id: row.pedido_id, pedido_encontrado: pedido?.comprobante });
                      return <TableCell key={col.id} sx={cellSx}>{pedido ? pedido.comprobante : (row.pedido_id ? `ID: ${row.pedido_id}` : '')}</TableCell>;
                    }
                    if (col.id === 'Codigo') {
                      return <TableCell key={col.id} sx={cellSx}>{row.Codigo || ''}</TableCell>;
                    }
                    if (col.id === 'cliente_id') {
                      // Buscar el nombre del cliente por Codigo o por cliente_id
                      let cliente = null;
                      if (row.Codigo) {
                        // Buscar por Codigo
                        cliente = clientes.find(c => c.Codigo === row.Codigo);
                      }
                      if (!cliente && row.cliente_id) {
                        // Si no se encuentra por Codigo, buscar por cliente_id
                        cliente = clientes.find(c => c.id === row.cliente_id);
                      }
                      return <TableCell key={col.id} sx={cellSx}>{cliente ? cliente.nombre : ''}</TableCell>;
                    }
                    if (col.id === 'transporte_id') {
                      const transporte = transportes.find(t => t.id === row.transporte_id);
                      return <TableCell key={col.id} sx={cellSx}>{transporte ? transporte.nombre : ''}</TableCell>;
                    }
                    if (col.id === 'acciones') {
                      return (
                        <TableCell key={col.id} sx={cellSx}>
                          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <IconButton onClick={() => handleOpen(row)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#e8f0fe' }, p: 0.7 }} size="small"><Edit fontSize="small" /></IconButton>
                            <IconButton onClick={() => handleDelete(row.id)} sx={{ color: '#e53935', '&:hover': { bgcolor: '#fdeaea' }, p: 0.7 }} size="small"><Delete fontSize="small" /></IconButton>
                          </Box>
                        </TableCell>
                      );
                    }
                    if (col.id === 'recibido') {
                      return (
                        <TableCell key={col.id} sx={cellSx}>
                          <Checkbox
                            checked={!!row.recibido}
                            onChange={(e) => handleRecibidoToggle(row.id, e.target.checked)}
                            size="small"
                            sx={{ 
                              color: '#2563eb', 
                              '&.Mui-checked': { color: '#2563eb' },
                              '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.04)' }
                            }}
                            title={row.recibido ? "Marcar como no recibido" : "Marcar como recibido"}
                          />
                        </TableCell>
                      );
                    }
                    if (col.id === 'fecha_pedido') {
                      return <TableCell key={col.id} sx={cellSx}>{formatDate(row.fecha_pedido)}</TableCell>;
                    }
                    if (col.id === 'fecha') {
                      return <TableCell key={col.id} sx={cellSx}>{formatDate(row.fecha)}</TableCell>;
                    }
                    if (col.id === 'en_logistica') {
                      return (
                        <TableCell key={col.id} sx={cellSx}>
                          <Checkbox
                            checked={!!row.en_logistica}
                            onChange={(e) => handleLogisticaToggle(row.id, e.target.checked)}
                            size="small"
                            sx={{ 
                              color: '#2563eb', 
                              '&.Mui-checked': { color: '#2563eb' },
                              '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.04)' }
                            }}
                            title={row.en_logistica ? "Quitar de logística" : "Enviar a logística"}
                          />
                        </TableCell>
                      );
                    }
                    return <TableCell key={col.id} sx={cellSx}>{row[col.id]}</TableCell>;
                  })}
                </TableRow>
              );
            })}
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
          <TextField 
            label="Código (opcional)" 
            name="Codigo" 
            value={form.Codigo} 
            onChange={handleChange} 
            fullWidth 
            InputLabelProps={{ shrink: true }} 
            sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}
            helperText={clientesLoading ? "Buscando cliente..." : (form.cliente_id ? `Cliente seleccionado` : "")}
          />
          <Autocomplete
            options={pedidos}
            getOptionLabel={option => option.comprobante || ''}
            value={pedidos.find(p => Number(p.id) === Number(form.pedido_id)) || null}
            onChange={(_, newValue) => {
              console.log('Pedido seleccionado:', newValue);
              console.log('ID del pedido:', newValue?.id, 'tipo:', typeof newValue?.id);
              setForm(prev => {
                const newForm = { ...prev, pedido_id: newValue ? newValue.id : null };
                console.log('Nuevo form después de seleccionar pedido:', newForm);
                console.log('pedido_id en form:', newForm.pedido_id, 'tipo:', typeof newForm.pedido_id);
                return newForm;
              });
            }}
            onInputChange={(_, value) => {
              if (value && value.length > 0) {
                API.get('/pedidos', { params: { comprobante: value, pageSize: 100 } })
                  .then(res => setPedidos(res.data.data));
              } else if (value === '') {
                // Si el campo está vacío, cargar todos los pedidos
                API.get('/pedidos', { params: { pageSize: 10000 } })
                  .then(res => setPedidos(res.data.data));
              }
            }}
            renderInput={params => (
              <TextField {...params} label="Pedido (opcional)" variant="outlined" fullWidth />
            )}
            isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
            sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}
            filterOptions={(options) => options}
          />
          <Autocomplete
            options={clientes}
            getOptionLabel={option => option.nombre || ''}
            value={clientes.find(c => c.id === form.cliente_id) || null}
            onChange={(_, newValue) => {
              setForm(prev => ({ ...prev, cliente_id: newValue ? newValue.id : null }));
            }}
            onInputChange={(_, value) => {
              if (value && value.length > 0) {
                API.get('/clientes', { params: { nombre: value, pageSize: 100 } })
                  .then(res => setClientes(res.data.data));
              } else if (value === '') {
                // Si el campo está vacío, cargar todos los clientes
                API.get('/clientes', { params: { pageSize: 10000 } })
                  .then(res => setClientes(res.data.data));
              }
            }}
            renderInput={params => (
              <TextField {...params} label="Cliente (opcional)" variant="outlined" fullWidth />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}
            filterOptions={(options) => options}
          />
          <Autocomplete
            options={transportes}
            getOptionLabel={option => option.nombre || ''}
            value={transportes.find(t => t.id === form.transporte_id) || null}
            onChange={(_, newValue) => {
              setForm(prev => ({ ...prev, transporte_id: newValue ? newValue.id : null }));
            }}
            onInputChange={(_, value) => {
              if (value && value.length > 0) {
                API.get('/transportes', { params: { nombre: value, pageSize: 100 } })
                  .then(res => setTransportes(res.data.data));
              } else if (value === '') {
                // Si el campo está vacío, cargar todos los transportes
                API.get('/transportes', { params: { pageSize: 10000 } })
                  .then(res => setTransportes(res.data.data));
              }
            }}
            renderInput={params => (
              <TextField {...params} label="Transporte (opcional)" variant="outlined" fullWidth />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}
            filterOptions={(options) => options}
          />
          <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
            <InputLabel shrink>Tipo</InputLabel>
            <Select name="tipo" value={form.tipo} onChange={handleChange} label="Tipo">
              <MenuItem value="cobro">Cobro</MenuItem>
              <MenuItem value="pago">Pago</MenuItem>
              <MenuItem value="entrega_material">Entrega de material</MenuItem>
              <MenuItem value="retiro_material">Retiro de material</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
            <Checkbox
              name="recibido"
              checked={form.recibido || false}
              onChange={handleChange}
              sx={{ 
                color: '#2563eb', 
                '&.Mui-checked': { color: '#2563eb' }
              }}
            />
            <Typography sx={{ ml: 1, fontSize: 14, color: '#22336b', fontWeight: 500 }}>
              Recibido
            </Typography>
          </Box>
          <TextField label="Fecha Entrega" name="fecha" type="date" value={form.fecha || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
          <TextField label="Observaciones" name="texto" value={form.texto} onChange={handleChange} fullWidth multiline minRows={2} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, mt: 0, mb: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined" color="secondary" sx={{ minWidth: 120, fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ minWidth: 120, fontWeight: 600, ml: 2 }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}




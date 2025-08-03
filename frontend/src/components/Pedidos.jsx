import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination,
  IconButton, Button, TextField, Select, MenuItem, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, Menu, Box, Autocomplete
} from '@mui/material';
import { Edit, Delete, Add, FileDownload } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
    
    // Para otros formatos, usar Date pero evitar zona horaria
    const date = new Date(dateString + (dateString.includes('T') ? '' : 'T00:00:00'));
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
  { id: 'comprobante', label: 'Comprobante' },
  { id: 'Codigo', label: 'Código' },
  { id: 'cliente_nombre', label: 'Cliente' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'armador_nombre', label: 'Armador' },
  { id: 'tipo_transporte_nombre', label: 'Tipo Tte' },
  { id: 'transporte_nombre', label: 'Transporte' },
  { id: 'vendedor_nombre', label: 'Vendedor' },
  { id: 'cant_bultos', label: 'Cant' },
  { id: 'tipo_bultos', label: 'Tipo' },
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
    Codigo: '',
    direccion: '',
    armador_id: '',
    tipo_transporte_id: '',
    transporte_id: '',
    vendedor_id: '',
    cant_bultos: '',
    tipo_bultos: '',
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
    Codigo: row.Codigo || '',
    direccion: row.direccion || '',
    armador_id: row.armador_id || '',
    tipo_transporte_id: row.tipo_transporte_id || '',
    transporte_id: row.transporte_id || '',
    vendedor_id: row.vendedor_id || '',
    cant_bultos: row.cant_bultos || '',
    tipo_bultos: row.tipo_bultos || '',
    fecha_entrega: row.fecha_entrega || '',
    estado_id: row.estado_id || '',
    notas: row.notas || ''
  } : {
    comprobante: '',
    cliente_id: '',
    Codigo: '',
    direccion: '',
    armador_id: '',
    tipo_transporte_id: '',
    transporte_id: '',
    vendedor_id: '',
    cant_bultos: '',
    tipo_bultos: '',
    fecha_entrega: '',
    estado_id: '',
    notas: ''
  });
  setOpen(true);
  };

  // Cerrar diálogo
  const handleClose = () => {
    setOpen(false);
    setEditRow(null);
    setForm({ comprobante: '', cliente_id: '', Codigo: '', direccion: '', armador_id: '', tipo_transporte_id: '', transporte_id: '', vendedor_id: '', cant_bultos: '', tipo_bultos: '', fecha_entrega: '', estado_id: '', notas: '' });
  };

  // Manejar cambios en el form
  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'Codigo') {
      // Buscar por código y autocompletar cliente y dirección
      setForm(prev => ({ ...prev, Codigo: value }));
      if (value && value.length > 0 && /^[0-9]{1,5}$/.test(value)) {
        setClientesLoading(true);
        API.get('/clientes', { params: { Codigo: value, pageSize: 1 } })
          .then(res => {
            const cliente = res.data.data[0];
            if (cliente) {
              setForm(prev => ({
                ...prev,
                cliente_id: cliente.id,
                Codigo: cliente.Codigo || '',
                direccion: cliente.direccion || '',
                cliente_nombre: cliente.nombre || ''
              }));
            }
          })
          .finally(() => setClientesLoading(false));
      }
    } else if (name === 'cliente_id') {
      const cliente = clientes.find(c => String(c.id) === String(value));
      setForm(prev => ({
        ...prev,
        cliente_id: value,
        Codigo: cliente && cliente.Codigo ? cliente.Codigo : '',
        direccion: cliente && cliente.direccion ? cliente.direccion : '',
        cliente_nombre: cliente && cliente.nombre ? cliente.nombre : ''
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Guardar pedido (alta o edición)
  const handleSubmit = async () => {
    try {
      // Preparar datos convirtiendo campos enteros vacíos a null
      const submitData = {
        comprobante: form.comprobante || null,
        cliente_id: form.cliente_id || null,
        Codigo: form.Codigo && form.Codigo !== '' ? Number(form.Codigo) : null,
        direccion: form.direccion || null,
        armador_id: form.armador_id || null,
        tipo_transporte_id: form.tipo_transporte_id || null,
        transporte_id: form.transporte_id || null,
        vendedor_id: form.vendedor_id || null,
        cant_bultos: form.cant_bultos && form.cant_bultos !== '' ? Number(form.cant_bultos) : null,
        tipo_bultos: form.tipo_bultos || null,
        fecha_entrega: form.fecha_entrega || null,
        estado_id: form.estado_id || null,
        notas: form.notas || null
      };
      
      if (editRow) {
        await API.put(`/pedidos/${editRow.id}`, submitData);
      } else {
        await API.post('/pedidos', submitData);
      }
      setOpen(false);
      setEditRow(null);
      setForm({ comprobante: '', cliente_id: '', Codigo: '', direccion: '', armador_id: '', tipo_transporte_id: '', transporte_id: '', vendedor_id: '', cant_bultos: '', tipo_bultos: '', fecha_entrega: '', estado_id: '', notas: '' });
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
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      console.error('Datos enviados:', submitData);
      alert('Error al guardar el pedido: ' + (error.response?.data?.message || error.message));
    }
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
    // Debug temporal
    if (filters.fecha_entrega) {
      console.log('Pedidos - Enviando filtro de fecha al backend:', filters.fecha_entrega);
    }
    
    API.get('/pedidos', {
      params: {
        ...filters,
        page: page + 1,
        pageSize
      }
    }).then(res => {
      setData(res.data.data);
      setTotal(Number(res.data.total) || 0);
      
      // Debug temporal
      if (filters.fecha_entrega) {
        console.log('Pedidos - Datos recibidos del backend:', res.data.data.length, 'registros');
      }
    });
  }, [filters, page, pageSize]);

  // Handlers de paginación
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };

  // Catálogos para selects
  const [clientes, setClientes] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [estados, setEstados] = useState([]);
  const [armadores, setArmadores] = useState([]);
  const [tiposTransporte, setTiposTransporte] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [vendedores, setVendedores] = useState([]);

  // Cargar catálogos al montar (excepto clientes)
  useEffect(() => {
    API.get('/estados').then(res => setEstados(res.data.data));
    API.get('/armadores').then(res => setArmadores(res.data.data));
    API.get('/tipos-transporte').then(res => setTiposTransporte(res.data.data));
    API.get('/transportes').then(res => setTransportes(res.data.data));
    API.get('/vendedores').then(res => setVendedores(res.data.data));
  }, []);
  // Maneja los cambios en los filtros de la tabla
  const handleFilter = (e) => {
    const { name, value } = e.target;
    
    // Para el filtro de fecha, asegurar formato correcto
    if (name === 'fecha_entrega' && value) {
      // Validar que sea una fecha válida en formato YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(value)) {
        setFilters(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // Función para limpiar los filtros
  const handleClearFilters = () => {
    setFilters({ comprobante: '', cliente: '', fecha_entrega: '', estado: '' });
  };

  // Función de sorting (placeholder por ahora)
  const handleSort = (columnId) => {
    // Por ahora solo un console.log, se puede implementar sorting más tarde
    console.log('Sorting by:', columnId);
  };
  const [data, setData] = useState([]);
  // ...aquí van los hooks y lógica existentes...
  // El único return debe estar al final de la función Pedidos

  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = data.map(row => {
      const obj = {};
      columns.forEach(col => {
        if (col.id !== 'acciones') {
          obj[col.label] = col.id === 'fecha_entrega' ? formatDate(row[col.id]) : row[col.id];
        }
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PedidosTotales');
    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `PedidosTotales_${fecha}.xlsx`);
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4'); // Orientación apaisada
    const exportData = data.map(row => columns.filter(col => col.id !== 'acciones').map(col => 
      col.id === 'fecha_entrega' ? formatDate(row[col.id]) : row[col.id]
    ));
    doc.autoTable({
      head: [columns.filter(col => col.id !== 'acciones').map(col => col.label)],
      body: exportData,
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [34,51,107],
        fontSize: 8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 18 }, // Comprobante
        1: { cellWidth: 12 }, // Código
        2: { cellWidth: 35 }, // Cliente
        3: { cellWidth: 30 }, // Dirección
        4: { cellWidth: 20 }, // Armador
        5: { cellWidth: 15 }, // Tipo Tte
        6: { cellWidth: 25 }, // Transporte
        7: { cellWidth: 20 }, // Vendedor
        8: { cellWidth: 10 }, // Cant
        9: { cellWidth: 12 }, // Tipo
        10: { cellWidth: 18 }, // Fecha Entrega
        11: { cellWidth: 15 }, // Estado
        12: { cellWidth: 30 } // Notas
      },
      margin: { top: 15, left: 10, right: 10 },
      tableWidth: 'auto'
    });
    const fecha = new Date().toISOString().slice(0,10);
    doc.save(`PedidosTotales_${fecha}.pdf`);
  };

  const [exportAnchor, setExportAnchor] = React.useState(null);
  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  return (
    <>
      {/* Acciones principales */}
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
          <Autocomplete
            options={clientes}
            getOptionLabel={option => option.nombre || ''}
            value={clientes.find(c => String(c.id) === String(filters.cliente)) || null}
            onChange={(_, value) => {
              handleFilter({ target: { name: 'cliente', value: value ? value.id : '' } });
            }}
            onInputChange={(_, value) => {
              if (value && value.length > 2) {
                API.get('/clientes', { params: { nombre: value, pageSize: 20 } })
                  .then(res => setClientes(res.data.data));
              } else {
                setClientes([]);
              }
            }}
            renderInput={params => (
              <TextField {...params} placeholder="Cliente" variant="outlined" size="small" fullWidth />
            )}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
            openOnFocus
            autoHighlight
            disablePortal
          />
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
      </Box>

      <TableContainer sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)', border: '1px solid #e0e3e7', background: '#fff' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ background: '#f6f8fa' }}>
              {columns.map(col => {
                let cellSx = {
                  cursor: col.id !== 'acciones' ? 'pointer' : 'default',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#22336b',
                  borderBottom: '2px solid #e0e3e7',
                  background: '#f6f8fa',
                  letterSpacing: 0.1,
                  py: 0.8
                };
                if (col.id === 'comprobante') cellSx = { ...cellSx, minWidth: 70, width: 80, maxWidth: 90 };
                if (col.id === 'Codigo') cellSx = { ...cellSx, minWidth: 60, width: 70, maxWidth: 80 };
                if (col.id === 'cliente_nombre') cellSx = { ...cellSx, minWidth: 110, width: 120, maxWidth: 140 };
                if (col.id === 'direccion') cellSx = { ...cellSx, minWidth: 90, width: 100, maxWidth: 120 };
                if (col.id === 'armador_nombre') cellSx = { ...cellSx, minWidth: 70, width: 80, maxWidth: 90 };
                if (col.id === 'tipo_transporte_nombre') cellSx = { ...cellSx, minWidth: 60, width: 70, maxWidth: 80 };
                if (col.id === 'transporte_nombre') cellSx = { ...cellSx, minWidth: 80, width: 90, maxWidth: 100 };
                if (col.id === 'vendedor_nombre') cellSx = { ...cellSx, minWidth: 70, width: 80, maxWidth: 90 };
                if (col.id === 'cant_bultos') cellSx = { ...cellSx, minWidth: 45, width: 50, maxWidth: 60 };
                if (col.id === 'tipo_bultos') cellSx = { ...cellSx, minWidth: 55, width: 65, maxWidth: 75 };
                if (col.id === 'fecha_entrega') cellSx = { ...cellSx, minWidth: 80, width: 90, maxWidth: 100 };
                if (col.id === 'estado_nombre') cellSx = { ...cellSx, minWidth: 65, width: 75, maxWidth: 85 };
                if (col.id === 'notas') cellSx = { ...cellSx, minWidth: 90, width: 100, maxWidth: 120 };
                if (col.id === 'acciones') cellSx = { ...cellSx, minWidth: 70, width: 80, maxWidth: 90 };
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
                  let cellSx = { fontSize: 12, color: '#22336b', py: 0.6, px: 0.8 };
                  if (col.id === 'comprobante') cellSx = { ...cellSx, minWidth: 70, width: 80, maxWidth: 90 };
                  if (col.id === 'Codigo') cellSx = { ...cellSx, minWidth: 60, width: 70, maxWidth: 80, textAlign: 'center' };
                  if (col.id === 'cliente_nombre') cellSx = { ...cellSx, minWidth: 110, width: 120, maxWidth: 140 };
                  if (col.id === 'direccion') cellSx = { ...cellSx, minWidth: 90, width: 100, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
                  if (col.id === 'armador_nombre') cellSx = { ...cellSx, minWidth: 70, width: 80, maxWidth: 90 };
                  if (col.id === 'tipo_transporte_nombre') cellSx = { ...cellSx, minWidth: 60, width: 70, maxWidth: 80 };
                  if (col.id === 'transporte_nombre') cellSx = { ...cellSx, minWidth: 80, width: 90, maxWidth: 100 };
                  if (col.id === 'vendedor_nombre') cellSx = { ...cellSx, minWidth: 70, width: 80, maxWidth: 90 };
                  if (col.id === 'cant_bultos') cellSx = { ...cellSx, minWidth: 45, width: 50, maxWidth: 60, textAlign: 'center' };
                  if (col.id === 'tipo_bultos') cellSx = { ...cellSx, minWidth: 55, width: 65, maxWidth: 75 };
                  if (col.id === 'fecha_entrega') cellSx = { ...cellSx, minWidth: 80, width: 90, maxWidth: 100 };
                  if (col.id === 'estado_nombre') cellSx = { ...cellSx, minWidth: 65, width: 75, maxWidth: 85 };
                  if (col.id === 'notas') cellSx = { ...cellSx, minWidth: 90, width: 100, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
                  if (col.id === 'acciones') cellSx = { ...cellSx, minWidth: 70, width: 80, maxWidth: 90, textAlign: 'center' };
                  return col.id === 'acciones' ? (
                    <TableCell key={col.id} sx={cellSx}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
                        <IconButton onClick={() => handleOpen(row)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#e8f0fe' }, p: 0.4 }} size="small"><Edit fontSize="small" /></IconButton>
                        <IconButton onClick={() => handleDelete(row.id)} sx={{ color: '#e53935', '&:hover': { bgcolor: '#fdeaea' }, p: 0.4 }} size="small"><Delete fontSize="small" /></IconButton>
                      </Box>
                    </TableCell>
                  ) : (
                    <TableCell key={col.id} sx={cellSx}>
                      {col.id === 'fecha_entrega' ? formatDate(row[col.id]) : row[col.id]}
                    </TableCell>
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
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, mb: 1 }}>{editRow ? 'Editar Pedido' : 'Nuevo Pedido'}</DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 3,
            py: 2,
            background: '#f8fafc',
            borderRadius: 2,
            boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)',
            overflow: 'visible',
            mt: 0,
          }}
        >
          {/* Fila 1: Información básica del pedido */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <TextField label="Comprobante" name="comprobante" value={form.comprobante} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }} />
            <TextField label="Código" name="Codigo" value={form.Codigo} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }} />
            <TextField label="Fecha Entrega" name="fecha_entrega" type="date" value={form.fecha_entrega} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }} />
          </Box>

          {/* Fila 2: Cliente y dirección */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
              <InputLabel shrink>Cliente</InputLabel>
              <Box sx={{ pt: 0, pb: 0 }}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={option => option.nombre || ''}
                  value={clientes.find(c => String(c.id) === String(form.cliente_id)) || null}
                  onChange={(_, value) => {
                    setForm(prev => ({
                      ...prev,
                      cliente_id: value ? value.id : '',
                      Codigo: value && value.Codigo ? value.Codigo : '',
                      direccion: value && value.direccion ? value.direccion : '',
                      cliente_nombre: value && value.nombre ? value.nombre : ''
                    }));
                  }}
                  onInputChange={(_, value) => {
                    if (value && value.length > 0) {
                      setClientesLoading(true);
                      const isNumeric = /^\d+$/.test(value);
                      const params = isNumeric 
                        ? { Codigo: value, pageSize: 20 }
                        : { nombre: value, pageSize: 20 };
                      
                      API.get('/clientes', { params })
                        .then(res => setClientes(res.data.data))
                        .finally(() => setClientesLoading(false));
                    } else {
                      setClientes([]);
                    }
                  }}
                  loading={clientesLoading}
                  renderInput={params => (
                    <TextField {...params} placeholder="Buscar cliente o código..." variant="outlined" fullWidth InputLabelProps={{ shrink: true }} />
                  )}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                  openOnFocus
                  autoHighlight
                  disablePortal
                />
              </Box>
            </FormControl>
            <TextField label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }} />
          </Box>

          {/* Fila 3: Personal (armador, vendedor) y transporte */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
              <InputLabel shrink>Armador</InputLabel>
              <Select name="armador_id" value={form.armador_id} onChange={handleChange} label="Armador">
                {armadores.map(a => <MenuItem key={a.id} value={a.id}>{a.nombre} {a.apellido}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
              <InputLabel shrink>Vendedor</InputLabel>
              <Select name="vendedor_id" value={form.vendedor_id} onChange={handleChange} label="Vendedor">
                {vendedores.map(v => <MenuItem key={v.id} value={v.id}>{v.nombre} {v.apellido}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
              <InputLabel shrink>Tipo Tte</InputLabel>
              <Select
                name="tipo_transporte_id"
                value={form.tipo_transporte_id}
                onChange={handleChange}
                label="Tipo Tte"
                displayEmpty
              >
                <MenuItem value=""><em>Sin tipo</em></MenuItem>
                {tiposTransporte.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
              <InputLabel shrink>Transporte</InputLabel>
              <Select name="transporte_id" value={form.transporte_id} onChange={handleChange} label="Transporte">
                {transportes.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Fila 4: Detalles del envío */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Cantidad"
              name="cant_bultos"
              value={form.cant_bultos}
              onChange={handleChange}
              type="number"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}
            />
            <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
              <InputLabel shrink>Tipo</InputLabel>
              <Select name="tipo_bultos" value={form.tipo_bultos || ''} label="Tipo" onChange={handleChange}>
                <MenuItem value="Grande">Grande</MenuItem>
                <MenuItem value="Chico">Chico</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
              <InputLabel shrink>Estado</InputLabel>
              <Select name="estado_id" value={form.estado_id} onChange={handleChange} label="Estado">
                {estados.map(e => <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Fila 5: Notas (campo amplio) */}
          <TextField label="Notas" name="notas" value={form.notas} onChange={handleChange} fullWidth multiline rows={3} InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined" color="secondary" sx={{ minWidth: 120, fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ minWidth: 120, fontWeight: 600, ml: 2 }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

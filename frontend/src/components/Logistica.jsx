import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Box, 
  TablePagination, 
  TextField, 
  FormControl, 
  Select, 
  MenuItem, 
  Button, 
  Autocomplete, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton,
  Checkbox,
  Typography,
  Menu
} from '@mui/material';
import { Edit, FileDownload } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../api';

const formatDate = (input) => {
  if (!input) return '';
  // Obtener parte de fecha YYYY-MM-DD sin hora
  const datePart = input.toString().split('T')[0];
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

const compareDates = (dateString, filterDate) => {
  if (!filterDate) return true;
  try {
    if (!dateString) return false;
    
    // Obtener parte de fecha YYYY-MM-DD sin hora, evitando conversiones de timezone
    let pedidoDateStr = '';
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      pedidoDateStr = dateString;
    } else {
      // Para otros formatos, extraer solo la parte de fecha
      pedidoDateStr = dateString.toString().split('T')[0];
    }

    return pedidoDateStr === filterDate;
  } catch (error) {
    console.error('Error comparing dates:', error);
    return false;
  }
};

function Logistica() {
  const [pedidos, setPedidos] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [tiposTransporte, setTiposTransporte] = useState([]);
  const [estados, setEstados] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterArmador, setFilterArmador] = useState('');
  const [filterCompletado, setFilterCompletado] = useState('');
  const [filterFechaPedido, setFilterFechaPedido] = useState('');
  const [filterFechaEntrega, setFilterFechaEntrega] = useState('');
  const [filterTipoTte, setFilterTipoTte] = useState('');
  const [filterTransporte, setFilterTransporte] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingTransporte, setEditingTransporte] = useState('');
  const [editingTipoTransporte, setEditingTipoTransporte] = useState('');
  const [editingNotas, setEditingNotas] = useState('');
  const [exportAnchor, setExportAnchor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pedidosRes, devolucionesRes, vendedoresRes, clientesRes, transportesRes, tiposTransporteRes, estadosRes] = await Promise.all([
        api.get('/pedidos?pageSize=1000'),
        api.get('/devoluciones?pageSize=1000'),
        api.get('/vendedores?pageSize=1000'),
        api.get('/clientes?pageSize=1000'),
        api.get('/transportes?pageSize=1000'),
        api.get('/tipos-transporte?pageSize=1000'),
        api.get('/estados?pageSize=1000')
      ]);

      setPedidos(pedidosRes.data?.data || []);
      setDevoluciones(devolucionesRes.data?.data || []);
      setVendedores(vendedoresRes.data?.data || []);
      setClientes(clientesRes.data?.data || []);
      setTransportes(transportesRes.data?.data || []);
      setTiposTransporte(tiposTransporteRes.data?.data || []);
      setEstados(estadosRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // En caso de error, asegurar que todos los states sean arrays vacíos
      setPedidos([]);
      setDevoluciones([]);
      setVendedores([]);
      setClientes([]);
      setTransportes([]);
      setTiposTransporte([]);
      setEstados([]);
    }
  };

  useEffect(() => {
  const combined = [
      ...pedidos
        .filter(p => p.en_logistica === true)
        .map(p => ({
          ...p,
          tipo: 'Pedido',
          nro_comprobante: p.comprobante || 'Sin comprobante',
          cliente: p.cliente_nombre || 'No disponible',
          direccion: p.direccion || 'Sin dirección',
          cantidad: p.cant_bultos || 0,
          // Preferir campos de armador si vienen desde el backend, sino fallback a cliente_nombre
          armador: (p.armador_nombre || '') + (p.armador_apellido ? ` ${p.armador_apellido}` : '') || p.armador || p.cliente_nombre || 'No disponible',
          fecha_pedido: p.fecha_pedido || p.fecha,
          fecha_entrega: p.fecha_entrega || '',
          tipo_transporte: p.tipo_transporte_nombre || 'No disponible',
          transporte: p.transporte_nombre || 'No disponible',
          completado: p.completado || false,
          notas: p.notas || '' // Asegura que siempre exista el campo notas
        })),
      ...devoluciones
        .filter(d => d.en_logistica === true)
        .map(d => ({
          ...d,
          tipo: 'Devolución',
          nro_comprobante: d.comprobante || 'Sin comprobante',
          cliente: d.cliente_nombre || 'No disponible',
          direccion: d.direccion || 'Sin dirección',
          cantidad: d.cant_bultos || 0,
          armador: (d.armador_nombre || '') + (d.armador_apellido ? ` ${d.armador_apellido}` : '') || d.armador || d.cliente_nombre || 'No disponible',
          fecha_pedido: d.fecha_pedido || d.fecha,
          fecha_entrega: d.fecha_entrega || '',
          tipo_transporte: d.tipo_transporte_nombre || 'No disponible',
          transporte: d.transporte_nombre || 'No disponible',
          completado: d.completado || false,
          texto: d.texto || '' // Asegura que siempre exista el campo texto
        }))
    ];
    setCombinedData(combined);
  }, [pedidos, devoluciones]);

  useEffect(() => {
    let filtered = combinedData; // Mostrar todos, incluyendo completados

    if (filterVendedor && Array.isArray(vendedores)) {
      filtered = filtered.filter(item => 
        vendedores.find(v => v.id === item.vendedor_id)?.nombre?.toLowerCase().includes(filterVendedor.toLowerCase())
      );
    }

    if (filterCliente) {
      filtered = filtered.filter(item => 
        item.cliente?.toLowerCase().includes(filterCliente.toLowerCase())
      );
    }

    if (filterArmador) {
      filtered = filtered.filter(item => (item.armador || '').toLowerCase().includes(filterArmador.toLowerCase()));
    }

    if (filterCompletado) {
      if (filterCompletado === 'completado') {
        filtered = filtered.filter(item => item.completado);
      } else if (filterCompletado === 'pendiente') {
        filtered = filtered.filter(item => !item.completado);
      }
    }

    if (filterEstado && Array.isArray(estados)) {
      filtered = filtered.filter(item => 
        item.estado_id === parseInt(filterEstado)
      );
    }

    if (filterFechaPedido) {
      filtered = filtered.filter(item => compareDates(item.fecha_pedido, filterFechaPedido));
    }

    if (filterFechaEntrega) {
      filtered = filtered.filter(item => compareDates(item.fecha_entrega, filterFechaEntrega));
    }

    if (filterTipoTte) {
      filtered = filtered.filter(item => (item.tipo_transporte || '').toLowerCase().includes(filterTipoTte.toLowerCase()));
    }
    if (filterTransporte) {
      filtered = filtered.filter(item => (item.transporte || '').toLowerCase().includes(filterTransporte.toLowerCase()));
    }
    setFilteredData(filtered);
  }, [combinedData, filterVendedor, filterCliente, filterEstado, filterFechaPedido, filterFechaEntrega, filterTipoTte, filterTransporte, filterArmador, filterCompletado, vendedores, estados]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [editingDireccion, setEditingDireccion] = useState('');
  const handleEdit = (item) => {
    setEditingItem(item);
    setEditingTransporte(item.transporte_id || '');
    setEditingTipoTransporte(item.tipo_transporte_id || '');
    setEditingNotas(item.tipo === 'Pedido' ? (item.notas || '') : (item.texto || ''));
    setEditingDireccion(item.direccion || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const endpoint = editingItem.tipo === 'Pedido' ? '/pedidos' : '/devoluciones';
      // Asegurar que los campos sean string y no undefined/null
      const body = {
        transporte_id: editingTransporte || null,
        tipo_transporte_id: editingTipoTransporte || null,
        direccion: editingDireccion
      };
      if (editingItem.tipo === 'Pedido') {
        body.notas = typeof editingNotas === 'string' ? editingNotas : '';
      } else {
        body.texto = typeof editingNotas === 'string' ? editingNotas : '';
      }
      // Eliminar campos undefined/null excepto los que deben ir null
      Object.keys(body).forEach(key => {
        if (body[key] === undefined) delete body[key];
      });
      await api.put(`${endpoint}/${editingItem.id}`, body);
      setEditModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setEditingItem(null);
    setEditingTransporte('');
    setEditingTipoTransporte('');
    setEditingDireccion('');
  };

  const handleCompleted = async (item) => {
    try {
      const endpoint = item.tipo === 'Pedido' ? '/pedidos' : '/devoluciones';
      const newCompletedState = !item.completado; // Toggle del estado
      
      if (newCompletedState) {
        // Marcar como completado usando el endpoint específico
        await api.put(`${endpoint}/${item.id}/completado`);
      } else {
        // Desmarcar como completado usando el endpoint general
        await api.put(`${endpoint}/${item.id}`, {
          completado: false
        });
      }
      
      // Actualizar el estado local
      setCombinedData(prev => prev.map(row => 
        row.id === item.id && row.tipo === item.tipo 
          ? { ...row, completado: newCompletedState }
          : row
      ));
    } catch (error) {
      console.error('Error toggling completed state:', error);
    }
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = filteredData.map(row => ({
      'Nro Comprobante': row.nro_comprobante,
      'Tipo': row.tipo,
      'Cliente': row.cliente,
  'Dirección': row.direccion,
  'Armador': row.armador,
  'Cantidad': row.cantidad,
      'Fecha Pedido': formatDate(row.fecha_pedido),
      'Fecha Entrega': formatDate(row.fecha_entrega),
      'Vendedor': Array.isArray(vendedores) ? vendedores.find(v => v.id === row.vendedor_id)?.nombre || 'Sin vendedor' : 'Sin vendedor',
      'Estado': Array.isArray(estados) ? estados.find(e => e.id === row.estado_id)?.nombre || 'Sin estado' : 'Sin estado',
      'Tipo Tte': row.tipo_transporte,
      'Transporte': row.transporte
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logistica');
    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `Logistica_${fecha}.xlsx`);
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const exportData = filteredData.map(row => [
      row.nro_comprobante,
      row.tipo,
      row.cliente,
  row.direccion,
  row.armador,
  row.cantidad,
      formatDate(row.fecha_pedido),
      formatDate(row.fecha_entrega),
      Array.isArray(vendedores) ? vendedores.find(v => v.id === row.vendedor_id)?.nombre || 'Sin vendedor' : 'Sin vendedor',
      Array.isArray(estados) ? estados.find(e => e.id === row.estado_id)?.nombre || 'Sin estado' : 'Sin estado',
      row.tipo_transporte,
      row.transporte
    ]);

    doc.autoTable({
  head: [['Nro Comprobante', 'Tipo', 'Cliente', 'Dirección', 'Armador', 'Cantidad', 'Fecha Pedido', 'Fecha Entrega', 'Vendedor', 'Estado', 'Tipo Tte', 'Transporte']],
      body: exportData,
      styles: { 
        fontSize: 6,
        cellPadding: 1,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [34,51,107],
        fontSize: 7,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Nro Comprobante
        1: { cellWidth: 15 }, // Tipo
        2: { cellWidth: 28 }, // Cliente
        3: { cellWidth: 22 }, // Dirección
        4: { cellWidth: 18 }, // Armador
        5: { cellWidth: 12 }, // Cantidad
        6: { cellWidth: 18 }, // Fecha Pedido
        7: { cellWidth: 18 }, // Fecha Entrega
        8: { cellWidth: 20 }, // Vendedor
        9: { cellWidth: 15 }, // Estado
        10: { cellWidth: 15 }, // Tipo Tte
        11: { cellWidth: 20 } // Transporte
      }
    });

    const fecha = new Date().toISOString().slice(0,10);
    doc.save(`Logistica_${fecha}.pdf`);
  };

  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  const columns = [
    { id: 'nro_comprobante', label: 'Comprobante', minWidth: 50 },
    { id: 'cliente', label: 'Cliente', minWidth: 120 },
  { id: 'direccion', label: 'Dirección', minWidth: 120 },
  { id: 'armador', label: 'Armador', minWidth: 120 },
    { id: 'cantidad', label: 'Cantidad', minWidth: 70 },
    { id: 'fecha_pedido', label: 'Fecha Pedido', minWidth: 90 },
    { id: 'fecha_entrega', label: 'Fecha Entrega', minWidth: 90 },
    { id: 'vendedor', label: 'Vendedor', minWidth: 100 },
    { id: 'estado', label: 'Estado', minWidth: 80 },
    { id: 'tipo_tte', label: 'Tipo Tte', minWidth: 80 },
    { id: 'transporte', label: 'Transporte', minWidth: 100 },
    { id: 'notas', label: 'Notas/Observaciones', minWidth: 140 },
    { id: 'accion', label: 'Acción', minWidth: 60 },
    { id: 'completado', label: 'Completado', minWidth: 80 }
  ];

  return (
    <Box sx={{ p: 3 }}>
  {/* Filtros en una sola fila */}
  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filtros principales agrupados */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Filtrar por Vendedor"
            value={filterVendedor}
            onChange={e => setFilterVendedor(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          />
          <TextField
            label="Filtrar por Cliente"
            value={filterCliente}
            onChange={e => setFilterCliente(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          />
          <TextField
            label="Filtrar por Armador"
            value={filterArmador}
            onChange={e => setFilterArmador(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          />
          <TextField
            label="Filtrar por Tipo Tte"
            value={filterTipoTte}
            onChange={e => setFilterTipoTte(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          />
          <TextField
            label="Filtrar por Transporte"
            value={filterTransporte}
            onChange={e => setFilterTransporte(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          />
        </Box>

        {/* Filtros secundarios */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">Todos los Estados</MenuItem>
            {Array.isArray(estados) && estados.map((estado) => (
              <MenuItem key={estado.id} value={estado.id}>
                {estado.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={filterCompletado}
            onChange={(e) => setFilterCompletado(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="completado">Completado</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Fecha Pedido"
          type="date"
          value={filterFechaPedido}
          onChange={(e) => setFilterFechaPedido(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Fecha Entrega"
          type="date"
          value={filterFechaEntrega}
          onChange={(e) => setFilterFechaEntrega(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ minWidth: 120 }}
        />
        <Button 
          variant="outlined" 
          onClick={() => {
            setFilterVendedor('');
            setFilterCliente('');
              setFilterArmador('');
            setFilterEstado('');
            setFilterFechaPedido('');
            setFilterFechaEntrega('');
            setFilterTipoTte('');
            setFilterTransporte('');
              setFilterCompletado('');
          }}
          size="small"
        >
          Limpiar Filtros
        </Button>

      </Box>

      {/* Botón de exportación con contadores a la derecha */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
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
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          <Typography variant="body2" sx={{ 
            backgroundColor: '#e3f2fd', 
            padding: '4px 12px', 
            borderRadius: '16px',
            color: '#1976d2',
            fontSize: '0.75rem'
          }}>
            Pendientes: {filteredData.filter(item => !item.completado).length}
          </Typography>
          <Typography variant="body2" sx={{ 
            backgroundColor: '#f3e5f5', 
            padding: '4px 12px', 
            borderRadius: '16px',
            color: '#7b1fa2',
            fontSize: '0.75rem'
          }}>
            Completados: {filteredData.filter(item => item.completado).length}
          </Typography>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { fontSize: '0.75rem', padding: '6px 8px' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              {columns.map((column) => (
                <TableCell 
                  key={column.id} 
                  style={{ minWidth: column.minWidth, fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                const isCompleted = row.completado;
                const rowStyle = isCompleted 
                  ? { backgroundColor: '#f5f5f5', opacity: 0.6, '&:hover': { backgroundColor: '#eeeeee' } }
                  : { '&:hover': { backgroundColor: '#f9f9f9' } };
                
                return (
                  <TableRow key={`${row.tipo}-${row.id}-${index}`} sx={rowStyle}>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.nro_comprobante}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.cliente}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.direccion}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.armador || 'No disponible'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', textAlign: 'center', color: isCompleted ? '#666' : 'inherit' }}>{row.cantidad}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{formatDate(row.fecha_pedido)}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{formatDate(row.fecha_entrega)}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{Array.isArray(vendedores) ? vendedores.find(v => v.id === row.vendedor_id)?.nombre || 'Sin vendedor' : 'Sin vendedor'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{Array.isArray(estados) ? estados.find(e => e.id === row.estado_id)?.nombre || 'Sin estado' : 'Sin estado'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.tipo_transporte}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.transporte}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit', maxWidth: 180, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                      {row.tipo === 'Pedido' ? (row.notas || '') : (row.texto || '')}
                    </TableCell>
                    <TableCell sx={{ padding: '4px' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(row)}
                        color="primary"
                        sx={{ padding: '4px', opacity: isCompleted ? 0.5 : 1 }}
                        disabled={isCompleted}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
                      <Checkbox
                        size="small"
                        checked={row.completado || false}
                        onChange={() => handleCompleted(row)}
                        color={isCompleted ? "default" : "success"}
                        sx={{ 
                          color: isCompleted ? '#666' : 'inherit',
                          '&.Mui-checked': { 
                            color: isCompleted ? '#666' : '#2e7d32' 
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Dialog open={editModalOpen} onClose={handleCloseEdit}>
        <DialogTitle>Editar Transporte, Dirección y Notas/Observaciones</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <Select
              value={editingTipoTransporte}
              onChange={(e) => setEditingTipoTransporte(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Seleccionar Tipo de Transporte</MenuItem>
              {Array.isArray(tiposTransporte) && tiposTransporte.map((tipo) => (
                <MenuItem key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Select
              value={editingTransporte}
              onChange={(e) => setEditingTransporte(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Seleccionar Transporte</MenuItem>
              {Array.isArray(transportes) && transportes.map((transporte) => (
                <MenuItem key={transporte.id} value={transporte.id}>
                  {transporte.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Dirección"
            value={editingDireccion}
            onChange={e => setEditingDireccion(e.target.value)}
            multiline
            minRows={1}
            maxRows={3}
          />
          <TextField
            fullWidth
            margin="normal"
            label={editingItem?.tipo === 'Pedido' ? 'Notas' : 'Observaciones'}
            value={editingNotas}
            onChange={e => setEditingNotas(e.target.value)}
            multiline
            minRows={2}
            maxRows={6}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Logistica;

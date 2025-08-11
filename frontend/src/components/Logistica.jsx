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
  Typography
} from '@mui/material';
import { Edit, FileDownload } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../api';

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year.slice(-2)}`;
    }

    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const compareDates = (dateString, filterDate) => {
  if (!filterDate) return true;
  let pedidoDateStr = '';
  try {
    if (!dateString) return false;

    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      pedidoDateStr = dateString;
    } else {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      pedidoDateStr = `${year}-${month}-${day}`;
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
  const [filterFechaPedido, setFilterFechaPedido] = useState('');
  const [filterFechaEntrega, setFilterFechaEntrega] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingTransporte, setEditingTransporte] = useState('');
  const [editingTipoTransporte, setEditingTipoTransporte] = useState('');

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
      ...pedidos.map(p => ({
        ...p,
        tipo: 'Pedido',
        nro_comprobante: p.comprobante || 'Sin comprobante',
        cliente: p.cliente_nombre || 'No disponible',
        direccion: p.direccion || 'Sin dirección',
        cantidad: p.cant_bultos || 0,
        fecha_pedido: p.fecha_pedido || p.fecha,
        fecha_entrega: p.fecha_entrega || '',
        armador: p.cliente_nombre || 'No disponible',
        tipo_transporte: p.tipo_transporte_nombre || 'No disponible',
        transporte: p.transporte_nombre || 'No disponible',
        completado: false
      })),
      ...devoluciones.map(d => ({
        ...d,
        tipo: 'Devolución',
        nro_comprobante: d.comprobante || 'Sin comprobante',
        cliente: d.cliente_nombre || 'No disponible',
        direccion: d.direccion || 'Sin dirección',
        cantidad: d.cant_bultos || 0,
        fecha_pedido: d.fecha_pedido || d.fecha,
        fecha_entrega: d.fecha_entrega || '',
        armador: d.cliente_nombre || 'No disponible',
        tipo_transporte: d.tipo_transporte_nombre || 'No disponible',
        transporte: d.transporte_nombre || 'No disponible',
        completado: false
      }))
    ];
    setCombinedData(combined);
  }, [pedidos, devoluciones]);

  useEffect(() => {
    let filtered = combinedData.filter(item => !item.completado);

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

    setFilteredData(filtered);
  }, [combinedData, filterVendedor, filterCliente, filterEstado, filterFechaPedido, filterFechaEntrega, vendedores, estados]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditingTransporte(item.transporte_id || '');
    setEditingTipoTransporte(item.tipo_transporte_id || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const endpoint = editingItem.tipo === 'Pedido' ? '/pedidos' : '/devoluciones';
      await api.put(`${endpoint}/${editingItem.id}`, {
        transporte_id: editingTransporte,
        tipo_transporte_id: editingTipoTransporte
      });
      
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
  };

  const handleCompleted = async (item) => {
    try {
      const endpoint = item.tipo === 'Pedido' ? '/pedidos' : '/devoluciones';
      await api.put(`${endpoint}/${item.id}`, {
        ...item,
        completado: true,
        estado_id: estados.find(e => e.nombre?.toLowerCase().includes('completado'))?.id || item.estado_id
      });
      
      // Actualizar el estado local
      setCombinedData(prev => prev.map(row => 
        row.id === item.id && row.tipo === item.tipo 
          ? { ...row, completado: true }
          : row
      ));
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = filteredData.map(row => ({
      'Nro Comprobante': row.nro_comprobante,
      'Tipo': row.tipo,
      'Cliente': row.cliente,
      'Dirección': row.direccion,
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
      row.cantidad,
      formatDate(row.fecha_pedido),
      formatDate(row.fecha_entrega),
      Array.isArray(vendedores) ? vendedores.find(v => v.id === row.vendedor_id)?.nombre || 'Sin vendedor' : 'Sin vendedor',
      Array.isArray(estados) ? estados.find(e => e.id === row.estado_id)?.nombre || 'Sin estado' : 'Sin estado',
      row.tipo_transporte,
      row.transporte
    ]);

    doc.autoTable({
      head: [['Nro Comprobante', 'Tipo', 'Cliente', 'Dirección', 'Cantidad', 'Fecha Pedido', 'Fecha Entrega', 'Vendedor', 'Estado', 'Tipo Tte', 'Transporte']],
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
        2: { cellWidth: 30 }, // Cliente
        3: { cellWidth: 25 }, // Dirección
        4: { cellWidth: 12 }, // Cantidad
        5: { cellWidth: 18 }, // Fecha Pedido
        6: { cellWidth: 18 }, // Fecha Entrega
        7: { cellWidth: 20 }, // Vendedor
        8: { cellWidth: 15 }, // Estado
        9: { cellWidth: 15 }, // Tipo Tte
        10: { cellWidth: 20 } // Transporte
      }
    });

    const fecha = new Date().toISOString().slice(0,10);
    doc.save(`Logistica_${fecha}.pdf`);
  };

  const columns = [
    { id: 'nro_comprobante', label: 'Nro Comprobante', minWidth: 120 },
    { id: 'tipo', label: 'Tipo', minWidth: 80 },
    { id: 'cliente', label: 'Cliente', minWidth: 120 },
    { id: 'direccion', label: 'Dirección', minWidth: 120 },
    { id: 'cantidad', label: 'Cantidad', minWidth: 70 },
    { id: 'fecha_pedido', label: 'Fecha Pedido', minWidth: 90 },
    { id: 'fecha_entrega', label: 'Fecha Entrega', minWidth: 90 },
    { id: 'vendedor', label: 'Vendedor', minWidth: 100 },
    { id: 'estado', label: 'Estado', minWidth: 80 },
    { id: 'tipo_tte', label: 'Tipo Tte', minWidth: 80 },
    { id: 'transporte', label: 'Transporte', minWidth: 100 },
    { id: 'accion', label: 'Acción', minWidth: 60 },
    { id: 'completado', label: 'Completado', minWidth: 80 }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Título */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Vista Logística
      </Typography>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Autocomplete
          options={Array.isArray(vendedores) ? vendedores : []}
          getOptionLabel={(option) => option.nombre || ''}
          value={Array.isArray(vendedores) ? vendedores.find(v => v.nombre?.toLowerCase().includes(filterVendedor.toLowerCase())) || null : null}
          onChange={(event, value) => setFilterVendedor(value ? value.nombre : '')}
          renderInput={(params) => <TextField {...params} label="Filtrar por Vendedor" size="small" />}
          sx={{ minWidth: 180 }}
        />
        
        <TextField
          label="Filtrar por Cliente"
          value={filterCliente}
          onChange={(e) => setFilterCliente(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 130 }}>
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

        <TextField
          label="Fecha Pedido"
          type="date"
          value={filterFechaPedido}
          onChange={(e) => setFilterFechaPedido(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ minWidth: 130 }}
        />

        <TextField
          label="Fecha Entrega"
          type="date"
          value={filterFechaEntrega}
          onChange={(e) => setFilterFechaEntrega(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ minWidth: 130 }}
        />

        <Button 
          variant="outlined" 
          onClick={() => {
            setFilterVendedor('');
            setFilterCliente('');
            setFilterEstado('');
            setFilterFechaPedido('');
            setFilterFechaEntrega('');
          }}
          size="small"
        >
          Limpiar Filtros
        </Button>
      </Box>

      {/* Botones de exportación */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<FileDownload />}
          onClick={handleExportExcel}
          sx={{ backgroundColor: '#1976d2' }}
        >
          Exportar Excel
        </Button>
        <Button
          variant="contained"
          startIcon={<FileDownload />}
          onClick={handleExportPDF}
          sx={{ backgroundColor: '#d32f2f' }}
        >
          Exportar PDF
        </Button>
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
              .map((row, index) => (
                <TableRow key={`${row.tipo}-${row.id}-${index}`} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.nro_comprobante}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.tipo}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.cliente}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.direccion}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', textAlign: 'center' }}>{row.cantidad}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(row.fecha_pedido)}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(row.fecha_entrega)}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    {Array.isArray(vendedores) ? vendedores.find(v => v.id === row.vendedor_id)?.nombre || 'Sin vendedor' : 'Sin vendedor'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    {Array.isArray(estados) ? estados.find(e => e.id === row.estado_id)?.nombre || 'Sin estado' : 'Sin estado'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.tipo_transporte}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.transporte}</TableCell>
                  <TableCell sx={{ padding: '4px' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(row)}
                      color="primary"
                      sx={{ padding: '4px' }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
                    <Checkbox
                      size="small"
                      checked={row.completado || false}
                      onChange={() => handleCompleted(row)}
                      color="success"
                    />
                  </TableCell>
                </TableRow>
              ))}
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
        <DialogTitle>Editar Transporte</DialogTitle>
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

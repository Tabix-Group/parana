import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import React, { useState, useEffect } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, TablePagination, TextField, FormControl, Select, MenuItem, Button, Autocomplete, Menu, ListItemIcon, ListItemText } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import API from '../api';

// Función robusta para formatear fechas a dd/mm/yy sin problemas de zona horaria
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

// Función robusta para comparar fechas sin problemas de zona horaria
const compareDates = (dateString, filterDate) => {
  if (!dateString || !filterDate) return false;
  
  try {
    // Convertir la fecha del pedido a formato YYYY-MM-DD sin zona horaria
    let pedidoDateStr;
    
    // Si ya está en formato YYYY-MM-DD
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      pedidoDateStr = dateString;
    } else {
      // Manejar diferentes formatos de fecha evitando problemas de zona horaria
      const pedidoDate = new Date(dateString + (dateString.includes('T') ? '' : 'T00:00:00'));
      if (isNaN(pedidoDate.getTime())) return false;
      
      // Usar getFullYear, getMonth, getDate para evitar zona horaria
      const year = pedidoDate.getFullYear();
      const month = (pedidoDate.getMonth() + 1).toString().padStart(2, '0');
      const day = pedidoDate.getDate().toString().padStart(2, '0');
      pedidoDateStr = `${year}-${month}-${day}`;
    }
    
    return pedidoDateStr === filterDate;
  } catch (error) {
    console.warn('Error comparing dates:', dateString, filterDate, error);
    return false;
  }
};

const columns = [
  { id: 'origen', label: 'Origen' },
  { id: 'comprobante', label: 'Comprobante' },
  { id: 'codigo', label: 'Código' },
  { id: 'cliente', label: 'Cliente' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'cantidad', label: 'Cantidad' },
  { id: 'tipo', label: 'Tipo' },
  { id: 'tipo_devolucion', label: 'Tipo de Devolución' },
  { id: 'fecha_pedido', label: 'Fecha Pedido' },
  { id: 'fecha', label: 'Fecha Entrega' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'completado', label: 'Completado' },
];

const pageSizes = [10, 15, 25, 50];

const Logistica = ({ pedidos, loading }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ 
    comprobante: '', 
    cliente: '', 
    fecha_pedido: '', 
    fecha_entrega: '', 
    transporte: '', 
    origen: '',
    completado: 'pendiente' // Default: mostrar solo pendientes
  });
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [data, setData] = useState([]);
  // Dropdown exportación
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleExportClick = (event) => setAnchorEl(event.currentTarget);
  const handleExportClose = () => setAnchorEl(null);
  
  // Pagination handlers
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
  
  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = filteredPedidos.map(p => {
      const row = {};
      columns.forEach(col => {
        if (col.id !== 'tipo' && col.id !== 'tipo_devolucion') {
          if (col.id === 'fecha' || col.id === 'fecha_pedido') {
            row[col.label] = formatDate(p[col.id]);
          } else if (col.id === 'completado') {
            row[col.label] = p.completado ? 'Sí' : 'No';
          } else {
            row[col.label] = p[col.id] ?? '';
          }
        }
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logistica');
    XLSX.writeFile(wb, 'logistica.xlsx');
    handleExportClose();
  };
  
  // Exportar a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = columns.filter(col => col.id !== 'tipo' && col.id !== 'tipo_devolucion').map(col => col.label);
    const tableRows = filteredPedidos.map(p =>
      tableColumn.map(label => {
        const col = columns.find(c => c.label === label);
        if (col.id === 'fecha' || col.id === 'fecha_pedido') return formatDate(p[col.id]);
        if (col.id === 'completado') return p.completado ? 'Sí' : 'No';
        return p[col.id] ?? '';
      })
    );
    doc.autoTable({ head: [tableColumn], body: tableRows });
    doc.save('logistica.pdf');
    handleExportClose();
  };

  useEffect(() => {
    // Cargar solo pedidos y devoluciones que están en logística
    Promise.all([
      API.get('/pedidos/logistica'),
      API.get('/devoluciones/logistica')
    ]).then(([pedidosRes, devolucionesRes]) => {
      // Mapear pedidos en logística
      const pedidosEnLogistica = (pedidosRes.data || []).map(p => ({ 
        ...p, 
        origen: 'Pedido',
        codigo: p.Codigo !== undefined && p.Codigo !== null ? String(p.Codigo) : '',
        cliente: p.cliente_nombre || '',
        direccion: p.cliente_direccion || p.direccion || '',
        transporte: p.transporte_nombre,
        fecha: p.fecha_entrega,
        cantidad: p.cant_bultos
      }));

      // Mapear devoluciones en logística
      const devolucionesEnLogistica = (devolucionesRes.data || []).map(d => ({ 
        ...d, 
        origen: 'Devolución',
        codigo: d.Codigo !== undefined && d.Codigo !== null ? String(d.Codigo) : '',
        cliente: d.cliente_nombre || '',
        direccion: d.cliente_direccion || '',
        transporte: d.transporte_nombre,
        comprobante: d.pedido_comprobante || '',
        cantidad: '',
      }));
      setData([...pedidosEnLogistica, ...devolucionesEnLogistica]);
    }).catch(error => {
      console.error('Error al cargar datos de logística:', error);
    });
  }, [refresh]);

  const handleCompletar = async (item) => {
    try {
      if (item.origen === 'Pedido') {
        // Alternar el estado de completado
        await API.put(`/pedidos/${item.id}/completado`);
      } else if (item.origen === 'Devolución') {
        // Alternar el estado de completado
        await API.put(`/devoluciones/${item.id}/completado`);
      }
      setRefresh(r => !r);
    } catch (error) {
      console.error('Error al cambiar estado de completado:', error);
      alert('Error al cambiar el estado: ' + (error.response?.data?.message || error.message));
    }
  };

  // Ya no necesitamos cargar los catálogos completos para los filtros de texto
  // useEffect(() => {
  //   API.get('/clientes').then(res => setClientes(res.data.data));
  //   API.get('/estados').then(res => setEstados(res.data.data));
  //   API.get('/transportes').then(res => setTransportes(res.data.data));
  // }, []);

  const handleFilter = (e) => {
    const { name, value } = e.target;
    
    // Para los filtros de fecha, validar formato
    if ((name === 'fecha_entrega' || name === 'fecha_pedido') && value) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(value)) {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(0);
      }
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
      setPage(0);
    }
  };
  const handleClearFilters = () => {
    setFilters({ 
      comprobante: '', 
      cliente: '', 
      fecha_pedido: '', 
      fecha_entrega: '', 
      transporte: '', 
      origen: '',
      completado: 'pendiente' // Mantener pendiente como default al limpiar
    });
    setPage(0);
  };

  // Filtrado frontend corregido para usar los nombres directos en lugar de IDs
  // Usar data local si existe, sino usar prop pedidos
  const pedidosToShow = data.length ? data : pedidos;
  const filteredPedidos = pedidosToShow.filter(p => {
    const matchComprobante = filters.comprobante === '' || (p.comprobante || '').toLowerCase().includes(filters.comprobante.toLowerCase());
    
    // Para cliente, buscar por nombre ya que el campo 'cliente' contiene el nombre
    const matchCliente = filters.cliente === '' || (p.cliente || '').toLowerCase().includes(filters.cliente.toLowerCase());
    
    // Para fecha, usar la función robusta de comparación
    const matchFecha = filters.fecha_entrega === '' || compareDates(p.fecha, filters.fecha_entrega);
    
    // Para fecha de pedido, usar la función robusta de comparación
    const matchFechaPedido = filters.fecha_pedido === '' || compareDates(p.fecha_pedido, filters.fecha_pedido);
    
    // Debug temporal para verificar fechas
    if (filters.fecha_entrega && p.fecha) {
      console.log('Debug fecha entrega:', {
        filterDate: filters.fecha_entrega,
        pedidoDate: p.fecha,
        comprobante: p.comprobante,
        matchResult: matchFecha
      });
    }
    
    if (filters.fecha_pedido && p.fecha_pedido) {
      console.log('Debug fecha pedido:', {
        filterDate: filters.fecha_pedido,
        pedidoDate: p.fecha_pedido,
        comprobante: p.comprobante,
        matchResult: matchFechaPedido
      });
    }
    
    
    // Para transporte, buscar por nombre ya que el campo 'transporte' contiene el nombre
    const matchTransporte = filters.transporte === '' || (p.transporte || '').toLowerCase().includes(filters.transporte.toLowerCase());
    
    // Filtro por origen si existe
    const matchOrigen = !filters.origen || filters.origen === '' || p.origen === filters.origen;
    
    // Filtro por estado de completado
    const matchCompletado = 
      filters.completado === '' || 
      (filters.completado === 'pendiente' && !p.completado) ||
      (filters.completado === 'completado' && p.completado);
    
    return matchComprobante && matchCliente && matchFecha && matchFechaPedido && matchTransporte && matchOrigen && matchCompletado;
  });
  const paginatedPedidos = filteredPedidos.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <>
      {/* Filtros y exportar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'center' }}>
        <Button
          variant="outlined"
          onClick={handleExportClick}
          startIcon={<DownloadIcon />}
          sx={{ fontWeight: 500, px: 2, py: 1, borderRadius: 2 }}
        >
          Exportar
        </Button>
        <Menu anchorEl={anchorEl} open={open} onClose={handleExportClose}>
          <MenuItem onClick={handleExportExcel}>
            <ListItemIcon><TableViewIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Excel</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleExportPDF}>
            <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
            <ListItemText>PDF</ListItemText>
          </MenuItem>
        </Menu>

        <TextField
          size="small"
          name="comprobante"
          value={filters.comprobante}
          onChange={handleFilter}
          placeholder="Comprobante"
          sx={{ minWidth: 120, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
        />

        <TextField
          size="small"
          name="cliente"
          value={filters.cliente}
          onChange={handleFilter}
          placeholder="Cliente"
          sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
        />
        <TextField
          size="small"
          name="fecha_pedido"
          value={filters.fecha_pedido}
          onChange={handleFilter}
          type="date"
          label="Fecha Pedido"
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
        />
        <TextField
          size="small"
          name="fecha_entrega"
          value={filters.fecha_entrega}
          onChange={handleFilter}
          type="date"
          label="Fecha Entrega"
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
        />
        <TextField
          size="small"
          name="transporte"
          value={filters.transporte}
          onChange={handleFilter}
          placeholder="Transporte"
          sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
        />
        <FormControl size="small" sx={{ minWidth: 120, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}>
          <Select name="origen" value={filters.origen || ''} onChange={e => { setFilters(f => ({ ...f, origen: e.target.value })); setPage(0); }} displayEmpty>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Pedido">Pedido</MenuItem>
            <MenuItem value="Devolución">Devolución</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}>
          <Select name="completado" value={filters.completado || 'pendiente'} onChange={e => { setFilters(f => ({ ...f, completado: e.target.value })); setPage(0); }} displayEmpty>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pendiente">Pendientes</MenuItem>
            <MenuItem value="completado">Completados</MenuItem>
          </Select>
        </FormControl>
        <Button onClick={handleClearFilters} sx={{ fontWeight: 500, px: 2, py: 1.2, borderRadius: 2 }}>Limpiar filtros</Button>
      </Box>
      <TableContainer sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)', border: '1px solid', borderColor: 'divider', background: 'background.paper' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map(col => {
                // Ocultar las columnas tipo y tipo_devolucion
                if (col.id === 'tipo' || col.id === 'tipo_devolucion') return null;
                
                return (
                  <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: 11, py: 0.6, textAlign: 'left' }}>{col.label}</TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.filter(col => col.id !== 'tipo' && col.id !== 'tipo_devolucion').length} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                  Cargando...
                </TableCell>
              </TableRow>
            ) : paginatedPedidos && paginatedPedidos.length > 0 ? (
              paginatedPedidos.map((pedido, idx) => (
                <TableRow key={pedido.id ? `p-${pedido.id}` : `d-${idx}`} sx={{ background: 'background.paper', '&:hover': { background: '#e8f0fe' } }}>
                  {columns.map(col => {
                    // Ocultar las columnas tipo y tipo_devolucion
                    if (col.id === 'tipo' || col.id === 'tipo_devolucion') return null;
                    
                    return (
                      col.id === 'completado' ? (
                        <TableCell key={col.id} sx={{ fontSize: 10, py: 0.4, px: 0.6, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={!!pedido.completado}
                            onChange={() => handleCompletar(pedido)}
                            title={pedido.completado ? "Marcar como no completado" : "Marcar como completado"}
                          />
                        </TableCell>
                      ) : (
                        <TableCell key={col.id} sx={{ fontSize: 10, py: 0.4, px: 0.6, textAlign: 'left' }}>
                          {col.id === 'fecha' || col.id === 'fecha_pedido' ? formatDate(pedido[col.id]) : (pedido[col.id] ?? '')}
                        </TableCell>
                      )
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.filter(col => col.id !== 'tipo' && col.id !== 'tipo_devolucion').length} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                  No hay pedidos para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredPedidos.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={pageSizes}
        sx={{ mt: 2 }}
      />
    </>
  );
};

export default Logistica;

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
import React, { useState, useEffect } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, TablePagination, TextField, FormControl, Select, MenuItem, Button, Autocomplete } from '@mui/material';
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
  { id: 'cliente', label: 'Cliente' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'cantidad', label: 'Cantidad' },
  { id: 'tipo', label: 'Tipo' },
  { id: 'tipo_devolucion', label: 'Tipo de Devolución' },
  { id: 'fecha_pedido', label: 'Fecha Pedido' },
  { id: 'fecha', label: 'Fecha Entrega' },
  { id: 'estado', label: 'Estado' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'completado', label: 'Completado' },
];

const pageSizes = [10, 15, 25, 50];

const Logistica = ({ pedidos, loading }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ comprobante: '', cliente: '', fecha_entrega: '', estado: '', transporte: '', origen: '' });
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Cargar pedidos y devoluciones pendientes
    Promise.all([
      API.get('/pedidos'),
      API.get('/devoluciones')
    ]).then(([pedidosRes, devolucionesRes]) => {
      // Asume que cada API devuelve { data: [...] }
      const pedidosPendientes = (pedidosRes.data.data || []).map(p => ({ ...p, origen: 'Pedido' })).filter(p => !p.completado);
      const devolucionesPendientes = (devolucionesRes.data.data || []).map(d => ({ ...d, origen: 'Devolución' })).filter(d => !d.completado);
      setData([...pedidosPendientes, ...devolucionesPendientes]);
    });
  }, [refresh]);

  const handleCompletar = async (item) => {
    if (item.origen === 'Pedido') {
      await API.put(`/pedidos/${item.id}/completado`);
    } else if (item.origen === 'Devolución') {
      await API.put(`/devoluciones/${item.id}/completado`);
    }
    setRefresh(r => !r);
  };

  // Ya no necesitamos cargar los catálogos completos para los filtros de texto
  // useEffect(() => {
  //   API.get('/clientes').then(res => setClientes(res.data.data));
  //   API.get('/estados').then(res => setEstados(res.data.data));
  //   API.get('/transportes').then(res => setTransportes(res.data.data));
  // }, []);

  const handleFilter = (e) => {
    const { name, value } = e.target;
    
    // Para el filtro de fecha, validar formato
    if (name === 'fecha_entrega' && value) {
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
    setFilters({ comprobante: '', cliente: '', fecha_entrega: '', estado: '', transporte: '', origen: '' });
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
    
    // Debug temporal para verificar fechas
    if (filters.fecha_entrega && p.fecha) {
      console.log('Debug fecha:', {
        filterDate: filters.fecha_entrega,
        pedidoDate: p.fecha,
        comprobante: p.comprobante,
        matchResult: matchFecha
      });
    }
    
    // Para estado, buscar por nombre ya que el campo 'estado' contiene el nombre
    const matchEstado = filters.estado === '' || (p.estado || '').toLowerCase().includes(filters.estado.toLowerCase());
    
    // Para transporte, buscar por nombre ya que el campo 'transporte' contiene el nombre
    const matchTransporte = filters.transporte === '' || (p.transporte || '').toLowerCase().includes(filters.transporte.toLowerCase());
    
    // Filtro por origen si existe
    const matchOrigen = !filters.origen || filters.origen === '' || p.origen === filters.origen;
    
    return matchComprobante && matchCliente && matchFecha && matchEstado && matchTransporte && matchOrigen;
  });
  const paginatedPedidos = filteredPedidos.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <>
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
          name="fecha_entrega"
          value={filters.fecha_entrega}
          onChange={handleFilter}
          type="date"
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
        />
        <TextField
          size="small"
          name="estado"
          value={filters.estado}
          onChange={handleFilter}
          placeholder="Estado"
          sx={{ minWidth: 120, bgcolor: '#fff', borderRadius: 1, boxShadow: '0 1px 4px 0 rgba(34,51,107,0.04)' }}
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
                  <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: 16 }}>{col.label}</TableCell>
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
                        <TableCell key={col.id}>
                          <input
                            type="checkbox"
                            checked={pedido.completado}
                            onChange={() => handleCompletar(pedido)}
                            disabled={pedido.completado}
                          />
                        </TableCell>
                      ) : (
                        <TableCell key={col.id}>
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

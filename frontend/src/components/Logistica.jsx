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
  IconButton 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
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
  const [filterDate, setFilterDate] = useState('');
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
        armador: p.cliente_nombre || 'No disponible',
        tipo_transporte: p.tipo_transporte_nombre || 'No disponible',
        transporte: p.transporte_nombre || 'No disponible'
      })),
      ...devoluciones.map(d => ({
        ...d,
        tipo: 'Devolución',
        armador: d.cliente_nombre || 'No disponible',
        tipo_transporte: d.tipo_transporte_nombre || 'No disponible',
        transporte: d.transporte_nombre || 'No disponible'
      }))
    ];
    setCombinedData(combined);
  }, [pedidos, devoluciones]);

  useEffect(() => {
    let filtered = combinedData;

    if (filterVendedor && Array.isArray(vendedores)) {
      filtered = filtered.filter(item => 
        vendedores.find(v => v.id === item.vendedor_id)?.nombre?.toLowerCase().includes(filterVendedor.toLowerCase())
      );
    }

    if (filterCliente) {
      filtered = filtered.filter(item => 
        item.armador?.toLowerCase().includes(filterCliente.toLowerCase())
      );
    }

    if (filterEstado && Array.isArray(estados)) {
      filtered = filtered.filter(item => 
        item.estado_id === parseInt(filterEstado)
      );
    }

    if (filterDate) {
      filtered = filtered.filter(item => compareDates(item.fecha, filterDate));
    }

    setFilteredData(filtered);
  }, [combinedData, filterVendedor, filterCliente, filterEstado, filterDate, vendedores, estados]);

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

  const columns = [
    { id: 'fecha', label: 'Fecha', minWidth: 100 },
    { id: 'tipo', label: 'Tipo', minWidth: 100 },
    { id: 'vendedor', label: 'Vendedor', minWidth: 150 },
    { id: 'armador', label: 'Armador', minWidth: 150 },
    { id: 'estado', label: 'Estado', minWidth: 120 },
    { id: 'tipo_tte', label: 'Tipo Tte', minWidth: 120 },
    { id: 'transporte', label: 'Transporte', minWidth: 150 },
    { id: 'accion', label: 'Acción', minWidth: 80 }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Autocomplete
          options={Array.isArray(vendedores) ? vendedores : []}
          getOptionLabel={(option) => option.nombre || ''}
          value={Array.isArray(vendedores) ? vendedores.find(v => v.nombre?.toLowerCase().includes(filterVendedor.toLowerCase())) || null : null}
          onChange={(event, value) => setFilterVendedor(value ? value.nombre : '')}
          renderInput={(params) => <TextField {...params} label="Filtrar por Vendedor" size="small" />}
          sx={{ minWidth: 200 }}
        />
        
        <TextField
          label="Filtrar por Cliente"
          value={filterCliente}
          onChange={(e) => setFilterCliente(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
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
          label="Filtrar por Fecha"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ minWidth: 150 }}
        />

        <Button 
          variant="outlined" 
          onClick={() => {
            setFilterVendedor('');
            setFilterCliente('');
            setFilterEstado('');
            setFilterDate('');
          }}
          size="small"
        >
          Limpiar Filtros
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} style={{ minWidth: column.minWidth }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow key={`${row.tipo}-${row.id}-${index}`}>
                  <TableCell>{formatDate(row.fecha)}</TableCell>
                  <TableCell>{row.tipo}</TableCell>
                  <TableCell>
                    {Array.isArray(vendedores) ? vendedores.find(v => v.id === row.vendedor_id)?.nombre || 'Sin vendedor' : 'Sin vendedor'}
                  </TableCell>
                  <TableCell>{row.armador}</TableCell>
                  <TableCell>
                    {Array.isArray(estados) ? estados.find(e => e.id === row.estado_id)?.nombre || 'Sin estado' : 'Sin estado'}
                  </TableCell>
                  <TableCell>{row.tipo_transporte}</TableCell>
                  <TableCell>{row.transporte}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(row)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
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

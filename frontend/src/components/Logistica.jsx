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
import { Edit, FileDownload, Add } from '@mui/icons-material';
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
  const [entregas, setEntregas] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [armadores, setArmadores] = useState([]);
  const [tiposTransporte, setTiposTransporte] = useState([]);
  const [estados, setEstados] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterComprobante, setFilterComprobante] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterArmador, setFilterArmador] = useState('');
  const [filterCompletado, setFilterCompletado] = useState('pendiente');
  const [filterOk, setFilterOk] = useState('no_ok');
  const [filterFechaEntrega, setFilterFechaEntrega] = useState(new Date().toISOString().split('T')[0]);
  const [filterTipoTte, setFilterTipoTte] = useState('');
  const [filterTransporte, setFilterTransporte] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingTransporte, setEditingTransporte] = useState('');
  const [editingTipoTransporte, setEditingTipoTransporte] = useState('');
  const [editingNotas, setEditingNotas] = useState('');
  const [exportAnchor, setExportAnchor] = useState(null);
  const [createEntregaModalOpen, setCreateEntregaModalOpen] = useState(false);
  const [creatingEntregaFor, setCreatingEntregaFor] = useState(null);
  const [newEntregaCantidad, setNewEntregaCantidad] = useState('');
  const [newEntregaDireccion, setNewEntregaDireccion] = useState('');
  const [newEntregaFechaEntrega, setNewEntregaFechaEntrega] = useState('');
  const [newEntregaTransporte, setNewEntregaTransporte] = useState('');
  const [newEntregaTipoTransporte, setNewEntregaTipoTransporte] = useState('');
  const [newEntregaArmador, setNewEntregaArmador] = useState('');
  const [newEntregaEstado, setNewEntregaEstado] = useState('');
  const [newEntregaNotas, setNewEntregaNotas] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pedidosRes, devolucionesRes, entregasRes, vendedoresRes, clientesRes, transportesRes, tiposTransporteRes, estadosRes, armadoresRes] = await Promise.all([
        api.get('/pedidos/logistica'),
        api.get('/devoluciones?pageSize=1000'),
        api.get('/entregas/logistica'),
        api.get('/vendedores', { params: { pageSize: 0 } }),
        api.get('/clientes?pageSize=1000'),
        api.get('/transportes?pageSize=1000'),
        api.get('/tipos-transporte?pageSize=1000'),
        api.get('/estados?pageSize=1000'),
        api.get('/armadores?pageSize=1000')
      ]);

      setPedidos(pedidosRes.data || []);
      setDevoluciones(devolucionesRes.data?.data || []);
      setEntregas(entregasRes.data || []);
      setVendedores(vendedoresRes.data?.data || []);
      setClientes(clientesRes.data?.data || []);
      setTransportes(transportesRes.data?.data || []);
      setTiposTransporte(tiposTransporteRes.data?.data || []);
      setEstados(estadosRes.data?.data || []);
      setArmadores(armadoresRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // En caso de error, asegurar que todos los states sean arrays vacíos
      setPedidos([]);
      setDevoluciones([]);
      setEntregas([]);
      setVendedores([]);
      setClientes([]);
      setTransportes([]);
      setTiposTransporte([]);
      setEstados([]);
      setArmadores([]);
    }
  };

  useEffect(() => {
    const combined = [
      ...pedidos
        .filter(p => {
          const tipo = (p.tipo_transporte_nombre || p.tipo_transporte || '').toString().toLowerCase();
          return !tipo.includes('retira');
        })
        .map(p => ({
          ...p,
          tipo: 'Pedido',
          subtipo: 'Original',
          nro_comprobante: p.comprobante || 'Sin comprobante',
          cliente: p.cliente_nombre || 'No disponible',
          direccion: p.direccion || 'Sin dirección',
          cantidad: p.cant_bultos || 0,
          armador: ((p.armador_nombre || '') + (p.armador_apellido ? ` ${p.armador_apellido}` : '')).trim() || (p.armador || ''),
          armador_id: p.armador_id || p.armador || null,
          fecha_pedido: p.fecha_pedido || p.fecha,
          fecha_entrega: p.fecha_entrega || '',
          tipo_transporte: p.tipo_transporte_nombre || 'No disponible',
          transporte: p.transporte_nombre || 'No disponible',
          completado: p.completado || false,
          notas: p.notas || ''
        })),
      ...devoluciones
        .filter(d => {
          if (!d.en_logistica) return false;
          const tipo = (d.tipo_transporte_nombre || d.tipo_transporte || '').toString().toLowerCase();
          return !tipo.includes('retira');
        })
        .map(d => ({
          ...d,
          tipo: 'Devolución',
          subtipo: 'Original',
          nro_comprobante: d.comprobante || 'Sin comprobante',
          cliente: d.cliente_nombre || 'No disponible',
          direccion: d.direccion || 'Sin dirección',
          cantidad: d.cant_bultos || 0,
          armador: ((d.armador_nombre || '') + (d.armador_apellido ? ` ${d.armador_apellido}` : '')).trim() || (d.armador || ''),
          armador_id: d.armador_id || d.armador || null,
          fecha_pedido: d.fecha_pedido || d.fecha,
          fecha_entrega: d.fecha_entrega || '',
          tipo_transporte: d.tipo_transporte_nombre || 'No disponible',
          transporte: d.transporte_nombre || 'No disponible',
          completado: d.completado || false,
          texto: d.texto || ''
        })),
      ...entregas
        .filter(e => {
          const tipo = (e.tipo_transporte_nombre || e.tipo_transporte || '').toString().toLowerCase();
          return !tipo.includes('retira');
        })
        .map(e => {
          return {
            ...e,
            tipo: 'Entrega',
            subtipo: `Parcial ${e.numero_entrega || 1}`,
            nro_comprobante: `${e.comprobante} (${e.numero_entrega || 1})`,
            cliente: e.cliente_nombre || 'No disponible',
            direccion: e.direccion || 'Sin dirección',
            cantidad: e.cant_bultos || 0,
            armador: ((e.armador_nombre || '') + (e.armador_apellido ? ` ${e.armador_apellido}` : '')).trim() || '',
            armador_id: e.armador_id || null,
            fecha_pedido: e.fecha_creacion || '',
            fecha_entrega: e.fecha_entrega || '',
            tipo_transporte: e.tipo_transporte_nombre || 'No disponible',
            transporte: e.transporte_nombre || 'No disponible',
            completado: e.completado || false,
            notas: e.notas || '',
            pedido_id: e.pedido_id,
            numero_entrega: e.numero_entrega || 1
          };
        })
    ];

    setCombinedData(combined);
  }, [pedidos, devoluciones, entregas]);

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

    if (filterComprobante) {
      filtered = filtered.filter(item =>
        item.nro_comprobante?.toLowerCase().includes(filterComprobante.toLowerCase()) ||
        (item.tipo === 'Entrega' && item.comprobante?.toLowerCase().includes(filterComprobante.toLowerCase()))
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

    if (filterOk) {
      if (filterOk === 'ok') filtered = filtered.filter(item => item.ok === true);
      else if (filterOk === 'no_ok') filtered = filtered.filter(item => !item.ok);
    }

    if (filterEstado && Array.isArray(estados)) {
      filtered = filtered.filter(item =>
        item.estado_id === parseInt(filterEstado)
      );
    }

    // fecha_pedido filter removed

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
  }, [combinedData, filterVendedor, filterCliente, filterComprobante, filterEstado, filterFechaEntrega, filterTipoTte, filterTransporte, filterArmador, filterCompletado, filterOk, vendedores, estados]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [editingDireccion, setEditingDireccion] = useState('');
  const [editingArmador, setEditingArmador] = useState('');
  const [editingEstado, setEditingEstado] = useState('');
  const [editingCantidad, setEditingCantidad] = useState('');
  const [editingFechaEntrega, setEditingFechaEntrega] = useState('');
  const handleEdit = (item) => {
    setEditingItem(item);
    setEditingTransporte(item.transporte_id || '');
    setEditingTipoTransporte(item.tipo_transporte_id || '');
    setEditingNotas(item.tipo === 'Pedido' ? (item.notas || '') : (item.texto || ''));
    setEditingDireccion(item.direccion || '');
    setEditingArmador(item.armador_id || item.armador || '');
    setEditingEstado(item.estado_id || '');
    setEditingCantidad(typeof item.cantidad !== 'undefined' && item.cantidad !== null ? item.cantidad : '');
    setEditingFechaEntrega(item.fecha_entrega || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      let endpoint;
      if (editingItem.tipo === 'Entrega') {
        endpoint = '/entregas';
      } else if (editingItem.tipo === 'Pedido') {
        endpoint = '/pedidos';
      } else {
        endpoint = '/devoluciones';
      }

      // Asegurar que los campos sean string y no undefined/null
      const body = {
        transporte_id: editingTransporte || null,
        tipo_transporte_id: editingTipoTransporte || null,
        direccion: editingDireccion,
        fecha_entrega: editingFechaEntrega || null
      };

      if (editingItem.tipo === 'Entrega') {
        body.notas = typeof editingNotas === 'string' ? editingNotas : '';
      } else if (editingItem.tipo === 'Pedido') {
        body.notas = typeof editingNotas === 'string' ? editingNotas : '';
      } else {
        body.texto = typeof editingNotas === 'string' ? editingNotas : '';
      }

      // Incluir armador_id si se definió (puede ser null para limpiar)
      if (editingArmador === '' || editingArmador === null) {
        body.armador_id = null;
      } else if (typeof editingArmador === 'string' || typeof editingArmador === 'number') {
        body.armador_id = editingArmador;
      }

      // Incluir estado si fue modificado
      if (editingEstado === '' || editingEstado === null) {
        body.estado_id = null;
      } else if (typeof editingEstado === 'string' || typeof editingEstado === 'number') {
        body.estado_id = editingEstado;
      }

      // Incluir cantidad (cant_bultos) si fue modificado
      if (editingCantidad === '' || editingCantidad === null) {
        // don't include field if empty string - server will handle coercion/backfill
      } else {
        // enviar como número si es posible
        const n = Number(editingCantidad);
        body.cant_bultos = Number.isNaN(n) ? editingCantidad : n;
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
    setEditingArmador('');
    setEditingEstado('');
    setEditingCantidad('');
    setEditingFechaEntrega('');
  };

  const handleCreateEntrega = (pedido) => {
    setCreatingEntregaFor(pedido);
    // Pre-llenar con datos del pedido
    setNewEntregaCantidad('');
    setNewEntregaDireccion(pedido.direccion || '');
    setNewEntregaFechaEntrega(pedido.fecha_entrega || '');
    setNewEntregaTransporte(pedido.transporte_id || '');
    setNewEntregaTipoTransporte(pedido.tipo_transporte_id || '');
    setNewEntregaArmador(pedido.armador_id || '');
    setNewEntregaEstado(pedido.estado_id || '');
    setNewEntregaNotas('');
    setCreateEntregaModalOpen(true);
  };

  const handleSaveNewEntrega = async () => {
    try {
      // Asegurar que la fecha esté en formato correcto
      let fechaEntrega = null;
      if (newEntregaFechaEntrega) {
        // Convertir a formato yyyy-MM-dd si viene con timezone
        if (newEntregaFechaEntrega.includes('T')) {
          fechaEntrega = newEntregaFechaEntrega.split('T')[0];
        } else {
          fechaEntrega = newEntregaFechaEntrega;
        }
      }

      const entregaData = {
        pedido_id: creatingEntregaFor.id,
        cant_bultos: Number(newEntregaCantidad) || 0,
        direccion: newEntregaDireccion,
        fecha_entrega: fechaEntrega,
        transporte_id: newEntregaTransporte || null,
        tipo_transporte_id: newEntregaTipoTransporte || null,
        armador_id: newEntregaArmador || null,
        estado_id: newEntregaEstado || null,
        notas: newEntregaNotas
      };

      await api.post('/entregas', entregaData);
      setCreateEntregaModalOpen(false);
      setCreatingEntregaFor(null);
      // Limpiar campos
      setNewEntregaCantidad('');
      setNewEntregaDireccion('');
      setNewEntregaFechaEntrega('');
      setNewEntregaTransporte('');
      setNewEntregaTipoTransporte('');
      setNewEntregaArmador('');
      setNewEntregaEstado('');
      setNewEntregaNotas('');
      fetchData();
    } catch (error) {
      console.error('Error creating entrega:', error);
    }
  };

  const handleCloseCreateEntrega = () => {
    setCreateEntregaModalOpen(false);
    setCreatingEntregaFor(null);
    setNewEntregaCantidad('');
    setNewEntregaDireccion('');
    setNewEntregaFechaEntrega('');
    setNewEntregaTransporte('');
    setNewEntregaTipoTransporte('');
    setNewEntregaArmador('');
    setNewEntregaEstado('');
    setNewEntregaNotas('');
  };

  const handleCompleted = async (item) => {
    try {
      let endpoint;
      if (item.tipo === 'Entrega') {
        endpoint = '/entregas';
      } else if (item.tipo === 'Pedido') {
        endpoint = '/pedidos';
      } else {
        endpoint = '/devoluciones';
      }

      const newCompletedState = !item.completado; // Toggle del estado

      if (newCompletedState) {
        // Marcar como completado usando el endpoint específico
        await api.put(`${endpoint}/${item.id}/completado`, { completado: true });
      } else {
        // Desmarcar como completado usando el endpoint específico
        await api.put(`${endpoint}/${item.id}/completado`, { completado: false });
      }

      // Actualizar el estado local
      setCombinedData(prev => prev.map(row =>
        row.id === item.id && row.tipo === item.tipo
          ? { ...row, completado: newCompletedState }
          : row
      ));

      // Si es un pedido que se está desmarcando como completado,
      // también desmarcar todas sus entregas
      if (!newCompletedState && item.tipo === 'Pedido') {
        try {
          const entregasResponse = await api.get(`/entregas?pedido_id=${item.id}`);
          const entregas = entregasResponse.data?.data || [];

          for (const entrega of entregas) {
            if (entrega.completado) {
              await api.put(`/entregas/${entrega.id}`, { completado: false });
            }
          }

          // Actualizar estado local de las entregas
          setCombinedData(prev => prev.map(row =>
            row.tipo === 'Entrega' && row.pedido_id === item.id
              ? { ...row, completado: false }
              : row
          ));
        } catch (error) {
          console.error('Error updating entregas:', error);
        }
      }

      fetchData(); // Refrescar datos para asegurar consistencia
    } catch (error) {
      console.error('Error toggling completed state:', error);
      // Si hay error, refrescar datos
      fetchData();
    }
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = filteredData.map(row => ({
      'Nro Comprobante': row.tipo === 'Entrega' ? row.comprobante : row.nro_comprobante,
      'Tipo': row.tipo,
      'Subtipo': row.subtipo || 'Original',
      'Cliente': row.cliente,
      'Dirección': row.direccion,
      'Armador': row.armador,
      'Cantidad': row.cantidad,
      'Fecha Entrega': formatDate(row.fecha_entrega),
      'Ok': row.ok ? 'Sí' : 'No',
      'Vendedor': Array.isArray(vendedores) ? vendedores.find(v => v.id === row.vendedor_id)?.nombre || 'Sin vendedor' : 'Sin vendedor',
      'Estado': Array.isArray(estados) ? estados.find(e => e.id === row.estado_id)?.nombre || 'Sin estado' : 'Sin estado',
      'Tipo Tte': row.tipo_transporte,
      'Transporte': row.transporte
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logistica');
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Logistica_${fecha}.xlsx`);
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const exportData = filteredData.map(row => [
      row.tipo === 'Entrega' ? row.comprobante : row.nro_comprobante,
      `${row.tipo}${row.subtipo && row.subtipo !== 'Original' ? ` - ${row.subtipo}` : ''}`,
      row.cliente,
      row.armador,
      row.direccion,
      row.cantidad,
      formatDate(row.fecha_entrega),
      row.ok ? 'Sí' : 'No',
      Array.isArray(vendedores) ? vendedores.find(v => v.id === row.vendedor_id)?.nombre || 'Sin vendedor' : 'Sin vendedor',
      Array.isArray(estados) ? estados.find(e => e.id === row.estado_id)?.nombre || 'Sin estado' : 'Sin estado',
      row.tipo_transporte,
      row.transporte
    ]);

    doc.autoTable({
      head: [['Nro Comprobante', 'Tipo', 'Cliente', 'Armador', 'Dirección', 'Cantidad', 'Fecha Entrega', 'Ok', 'Vendedor', 'Estado', 'Tipo Tte', 'Transporte']],
      body: exportData,
      styles: {
        fontSize: 6,
        cellPadding: 1,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [34, 51, 107],
        fontSize: 7,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Nro Comprobante
        1: { cellWidth: 15 }, // Tipo
        2: { cellWidth: 28 }, // Cliente
        3: { cellWidth: 22 }, // Armador
        4: { cellWidth: 18 }, // Dirección
        5: { cellWidth: 12 }, // Cantidad
        6: { cellWidth: 18 }, // Fecha Entrega
        7: { cellWidth: 20 }, // Vendedor
        8: { cellWidth: 15 }, // Estado
        9: { cellWidth: 15 }, // Tipo Tte
        10: { cellWidth: 20 } // Transporte
      }
    });

    const fecha = new Date().toISOString().slice(0, 10);
    doc.save(`Logistica_${fecha}.pdf`);
  };

  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  const columns = [
    { id: 'nro_comprobante', label: 'Comprobante', minWidth: 50 },
    { id: 'cliente', label: 'Cliente', minWidth: 120 },
    { id: 'armador', label: 'Armador', minWidth: 120 },
    { id: 'direccion', label: 'Dirección', minWidth: 120 },
    { id: 'cantidad', label: 'Cantidad', minWidth: 70 },
    { id: 'fecha_entrega', label: 'Fecha Entrega', minWidth: 90 },
    { id: 'vendedor', label: 'Vendedor', minWidth: 100 },
    { id: 'estado', label: 'Estado', minWidth: 80 },
    { id: 'tipo_tte', label: 'Tipo Tte', minWidth: 80 },
    { id: 'transporte', label: 'Transporte', minWidth: 100 },
    { id: 'notas', label: 'Notas/Observaciones', minWidth: 140 },
    { id: 'accion', label: 'Acción', minWidth: 60 },
    { id: 'ok', label: 'Ok', minWidth: 60 },
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
            label="Filtrar por Comprobante"
            value={filterComprobante}
            onChange={e => setFilterComprobante(e.target.value)}
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
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={filterOk} onChange={(e) => setFilterOk(e.target.value)} displayEmpty>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="ok">Ok</MenuItem>
            <MenuItem value="no_ok">No Ok</MenuItem>
          </Select>
        </FormControl>
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
          startIcon={<FileDownload />}
          onClick={handleExportClick}
          size="small"
        >
          Exportar
        </Button>
        <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={handleExportClose}>
          <MenuItem onClick={() => { handleExportExcel(); handleExportClose(); }}>Exportar a Excel</MenuItem>
          <MenuItem onClick={() => { handleExportPDF(); handleExportClose(); }}>Exportar a PDF</MenuItem>
        </Menu>

        <Button
          variant="outlined"
          onClick={() => {
            setFilterVendedor('');
            setFilterCliente('');
            setFilterComprobante('');
            setFilterArmador('');
            setFilterEstado('');
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

      {/* Indicador de entregas parciales */}
      <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
        <Typography variant="body2" sx={{
          backgroundColor: '#fff3e0',
          padding: '6px 12px',
          borderRadius: '12px',
          color: '#ff9800',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          border: '2px solid #ff9800'
        }}>
          📦 Entregas Parciales: {filteredData.filter(item => item.tipo === 'Entrega').length}
        </Typography>
        <Typography variant="body2" sx={{
          backgroundColor: '#e3f2fd',
          padding: '6px 12px',
          borderRadius: '12px',
          color: '#1976d2',
          fontSize: '0.8rem'
        }}>
          🔍 Total Filtrado: {filteredData.length}
        </Typography>
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
            {(() => {
              return filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isCompleted = row.completado;
                  const rowStyle = isCompleted
                    ? { backgroundColor: '#f5f5f5', opacity: 0.6, '&:hover': { backgroundColor: '#eeeeee' } }
                    : { '&:hover': { backgroundColor: '#f9f9f9' } };

                  return (
                    <TableRow key={`${row.tipo}-${row.id}-${index}`} sx={{
                      ...rowStyle,
                      ...(row.tipo === 'Entrega' && { backgroundColor: '#fff3e0', borderLeft: '3px solid #ff9800' })
                    }}>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>
                        {row.tipo === 'Entrega' ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                              {row.comprobante}
                            </Typography>
                            <Typography variant="caption" sx={{
                              display: 'block',
                              color: '#ff9800',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              backgroundColor: '#fff3e0',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              border: '1px solid #ff9800'
                            }}>
                              🔄 {row.subtipo}
                            </Typography>
                          </Box>
                        ) : (
                          row.nro_comprobante
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.cliente}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>
                        {row.armador_id ? (Array.isArray(armadores) ? (armadores.find(a => a.id === row.armador_id)?.nombre ? `${armadores.find(a => a.id === row.armador_id)?.nombre}${armadores.find(a => a.id === row.armador_id)?.apellido ? ' ' + armadores.find(a => a.id === row.armador_id)?.apellido : ''}` : row.armador) : row.armador) : (row.armador || '')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.direccion}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', textAlign: 'center', color: isCompleted ? '#666' : 'inherit' }}>{row.cantidad}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{formatDate(row.fecha_entrega)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{Array.isArray(vendedores) ? vendedores.find(v => v.id === row.vendedor_id)?.nombre || 'Sin vendedor' : 'Sin vendedor'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{Array.isArray(estados) ? estados.find(e => e.id === row.estado_id)?.nombre || 'Sin estado' : 'Sin estado'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.tipo_transporte}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit' }}>{row.transporte}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: isCompleted ? '#666' : 'inherit', maxWidth: 180, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                        {row.tipo === 'Pedido' ? (row.notas || '') : (row.texto || '')}
                      </TableCell>
                      <TableCell sx={{ padding: '4px' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {row.tipo === 'Pedido' && !isCompleted && (
                            <IconButton
                              size="small"
                              onClick={() => handleCreateEntrega(row)}
                              color="success"
                              sx={{ padding: '4px' }}
                              title="Crear entrega parcial"
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(row)}
                            color="primary"
                            sx={{ padding: '4px', opacity: isCompleted ? 0.5 : 1 }}
                            disabled={isCompleted}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
                        <Checkbox
                          size="small"
                          checked={row.ok || false}
                          onChange={async () => {
                            try {
                              let endpoint;
                              if (row.tipo === 'Entrega') {
                                endpoint = '/entregas';
                              } else if (row.tipo === 'Pedido') {
                                endpoint = '/pedidos';
                              } else {
                                endpoint = '/devoluciones';
                              }
                              await api.put(`${endpoint}/${row.id}/ok`, { ok: !row.ok });
                              // Optimistic update
                              setCombinedData(prev => prev.map(r => r.id === row.id && r.tipo === row.tipo ? { ...r, ok: !r.ok } : r));
                            } catch (err) {
                              console.error('Error toggling ok:', err);
                            }
                          }}
                          color={row.ok ? 'success' : 'default'}
                          sx={{ color: row.ok ? '#2e7d32' : 'inherit' }}
                        />
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
                          title={
                            row.tipo === 'Pedido' && entregas.some(e => e.pedido_id === row.id)
                              ? `Pedido con ${entregas.filter(e => e.pedido_id === row.id).length} entregas parciales`
                              : ''
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                });
            })()}
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
        <DialogTitle>
          {editingItem?.tipo === 'Entrega'
            ? `Editar Entrega Parcial ${editingItem?.subtipo || ''}`
            : 'Editar Transporte, Dirección, Fecha Entrega y Notas/Observaciones'
          }
        </DialogTitle>
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
            label="Fecha Entrega"
            type="date"
            value={editingFechaEntrega}
            onChange={e => setEditingFechaEntrega(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <Select
              value={editingArmador ?? ''}
              onChange={(e) => setEditingArmador(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Sin Armador</MenuItem>
              {Array.isArray(armadores) && armadores.map(a => (
                <MenuItem key={a.id} value={a.id}>{`${a.nombre || ''}${a.apellido ? ' ' + a.apellido : ''}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Select
              value={editingEstado ?? ''}
              onChange={(e) => setEditingEstado(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Sin Estado</MenuItem>
              {Array.isArray(estados) && estados.map(e => (
                <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Cantidad (bultos)"
            type="number"
            value={editingCantidad}
            onChange={e => setEditingCantidad(e.target.value)}
            inputProps={{ min: 0 }}
          />
          <TextField
            fullWidth
            margin="normal"
            label={
              editingItem?.tipo === 'Entrega' ? 'Notas de la Entrega' :
                editingItem?.tipo === 'Pedido' ? 'Notas' : 'Observaciones'
            }
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

      <Dialog open={createEntregaModalOpen} onClose={handleCloseCreateEntrega} maxWidth="md" fullWidth>
        <DialogTitle>
          Crear Nueva Entrega Parcial
          {creatingEntregaFor && (
            <Typography variant="subtitle2" color="text.secondary">
              Pedido: {creatingEntregaFor.comprobante} - Cliente: {creatingEntregaFor.cliente}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Cantidad (bultos)"
            type="number"
            value={newEntregaCantidad}
            onChange={e => setNewEntregaCantidad(e.target.value)}
            inputProps={{ min: 1 }}
            required
            helperText={creatingEntregaFor ? `Cantidad total del pedido: ${creatingEntregaFor.cantidad}` : ''}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Dirección"
            value={newEntregaDireccion}
            onChange={e => setNewEntregaDireccion(e.target.value)}
            multiline
            minRows={1}
            maxRows={3}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Fecha Entrega"
            type="date"
            value={newEntregaFechaEntrega}
            onChange={e => setNewEntregaFechaEntrega(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <Select
              value={newEntregaTipoTransporte}
              onChange={(e) => setNewEntregaTipoTransporte(e.target.value)}
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
              value={newEntregaTransporte}
              onChange={(e) => setNewEntregaTransporte(e.target.value)}
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
          <FormControl fullWidth margin="normal">
            <Select
              value={newEntregaArmador ?? ''}
              onChange={(e) => setNewEntregaArmador(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Sin Armador</MenuItem>
              {Array.isArray(armadores) && armadores.map(a => (
                <MenuItem key={a.id} value={a.id}>{`${a.nombre || ''}${a.apellido ? ' ' + a.apellido : ''}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Select
              value={newEntregaEstado ?? ''}
              onChange={(e) => setNewEntregaEstado(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Sin Estado</MenuItem>
              {Array.isArray(estados) && estados.map(e => (
                <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Notas de la Entrega"
            value={newEntregaNotas}
            onChange={e => setNewEntregaNotas(e.target.value)}
            multiline
            minRows={2}
            maxRows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateEntrega}>Cancelar</Button>
          <Button
            onClick={handleSaveNewEntrega}
            variant="contained"
            disabled={!newEntregaCantidad || newEntregaCantidad <= 0}
          >
            Crear Entrega
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Logistica;

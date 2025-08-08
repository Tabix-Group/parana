import React, { useEffect, useState } from 'react';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
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
  { id: 'cliente_nombre', label: 'Cliente' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'fecha_pedido', label: 'Fecha Pedido' },
  { id: 'fecha_entrega', label: 'Fecha Entrega' },
  { id: 'notas', label: 'Notas' }
];
const pageSizes = [10, 15, 25, 50];



export default function PedidosParciales() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchData(); }, [page, pageSize, filter]);

  const fetchData = async () => {
    const res = await API.get('/pedidos', {
      params: { page: page + 1, pageSize, parcial: true, filter }
    });
    setData(res.data.data);
    setTotal(Number(res.data.total));
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };

  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = data.map(row => {
      const obj = {};
      columns.forEach(col => {
        obj[col.label] = col.id === 'fecha_entrega' || col.id === 'fecha_pedido' ? formatDate(row[col.id]) : row[col.id];
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PedidosParciales');
    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `PedidosParciales_${fecha}.xlsx`);
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('Pedidos Parciales', 10, 15);
    
    const exportData = data.map(row => {
      return columns.map(col => {
        if (col.id === 'fecha_entrega' || col.id === 'fecha_pedido') {
          return formatDate(row[col.id]);
        }
        return row[col.id] || '';
      });
    });
    
    const headers = columns.map(col => col.label);
    
    doc.autoTable({
      head: [headers],
      body: exportData,
      startY: 25,
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 25 }, // Comprobante
        1: { cellWidth: 35 }, // Cliente
        2: { cellWidth: 35 }, // Dirección
        3: { cellWidth: 20 }, // Fecha Pedido
        4: { cellWidth: 20 }, // Fecha Entrega
        5: { cellWidth: 40 }, // Notas
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
    doc.save(`PedidosParciales_${fecha}.pdf`);
  };

  const [exportAnchor, setExportAnchor] = React.useState(null);
  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  // Filtrado local si el backend no lo soporta
  const filteredData = filter
    ? data.filter(row =>
        columns.some(col =>
          String(row[col.id] || '').toLowerCase().includes(filter.toLowerCase())
        )
      )
    : data;

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar..."
          style={{ padding: 8, borderRadius: 6, border: '1px solid #d0d7e2', minWidth: 220 }}
        />
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
                  py: 0.6
                };
                return (
                  <TableCell key={col.id} sx={cellSx}>{col.label}</TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row, idx) => (
              <TableRow key={row.comprobante} sx={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', '&:hover': { background: '#e8f0fe' } }}>
                {columns.map(col => (
                  <TableCell key={col.id} sx={{ fontSize: 10, py: 0.4, px: 0.6 }}>
                    {col.id === 'fecha_entrega' || col.id === 'fecha_pedido' ? formatDate(row[col.id]) : row[col.id]}
                  </TableCell>
                ))}
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
    </>
  );
}


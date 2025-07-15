import React, { useEffect, useState } from 'react';
import { Box, Button, Menu, MenuItem } from '@mui/material';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import API from '../api';

const columns = [
  { id: 'comprobante', label: 'Comprobante' },
  { id: 'cliente_nombre', label: 'Cliente' },
  { id: 'direccion', label: 'Dirección' },
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
        obj[col.label] = row[col.id];
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
    const doc = new jsPDF();
    const exportData = data.map(row => columns.map(col => row[col.id]));
    doc.autoTable({
      head: [columns.map(col => col.label)],
      body: exportData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34,51,107] }
    });
    const fecha = new Date().toISOString().slice(0,10);
    doc.save(`PedidosParciales_${fecha}.pdf`);
  };

  const [exportAnchor, setExportAnchor] = React.useState(null);
  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  return (
    <Box>
      {/* Título ahora en AppBar */}
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
                    ) : (
                      <TableCell key={col.id} sx={cellSx}>{row[col.id]}</TableCell>
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
      />
    </Box>
  );
}

import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, Box } from '@mui/material';
import API from '../api';

const columns = [
  { id: 'comprobante', label: 'Comprobante' },
  { id: 'cliente_nombre', label: 'Cliente' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'armador_nombre', label: 'Armador' },
  { id: 'tipo_transporte_nombre', label: 'Tipo Tte' },
  { id: 'transporte_nombre', label: 'Transporte' },
  { id: 'vendedor_nombre', label: 'Vendedor' },
  { id: 'fecha_entrega', label: 'Fecha Entrega' },
  { id: 'estado_nombre', label: 'Estado' },
  { id: 'notas', label: 'Notas' }
];

const pageSizes = [10, 15, 25, 50];

export default function PedidosVisual() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    API.get('/pedidos').then(res => {
      // Soporta respuesta { data, total } o array directa
      if (Array.isArray(res.data)) {
        setData(res.data);
        setTotal(res.data.length);
      } else if (res.data && Array.isArray(res.data.data)) {
        setData(res.data.data);
        setTotal(Number(res.data.total) || res.data.data.length);
      } else {
        setData([]);
        setTotal(0);
      }
    });
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper sx={{ p: { xs: 1, sm: 2 }, boxShadow: '0 4px 32px 0 rgba(34,51,107,0.10)', borderRadius: 3, border: '1.5px solid #e0e3e7', background: '#fff' }}>
      <TableContainer sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)', border: '1px solid #e0e3e7', background: '#fff' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ background: '#f6f8fa' }}>
              {columns.map(col => (
                <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: 16, color: '#22336b', borderBottom: '2px solid #e0e3e7', background: '#f6f8fa', letterSpacing: 0.2 }}>{col.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(page * pageSize, page * pageSize + pageSize).map((row, idx) => (
              <TableRow key={row.id} sx={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', transition: 'background 0.18s', '&:hover': { background: '#e8f0fe' } }}>
                {columns.map(col => (
                  <TableCell key={col.id} sx={{ fontSize: 15, color: '#22336b', py: 1.2, px: 1.5 }}>{row[col.id]}</TableCell>
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
    </Paper>
  );
}

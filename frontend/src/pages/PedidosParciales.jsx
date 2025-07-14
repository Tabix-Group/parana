import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination
} from '@mui/material';
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

  useEffect(() => { fetchData(); }, [page, pageSize]);

  const fetchData = async () => {
    const res = await API.get('/pedidos', {
      params: { page: page + 1, pageSize, estado: 3 }
    });
    setData(res.data.data);
    setTotal(Number(res.data.total));
  };
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };

  return (
    <Box>
      <h2 className="main-table-title">Pedidos Parciales</h2>
      <TableContainer>
        <Table className="main-table" size="small">
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={col.id} className="main-table-cell">{col.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(row => (
              <TableRow key={row.id}>
                {columns.map(col => (
                  <TableCell key={col.id} className="main-table-cell">{row[col.id]}</TableCell>
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
      />
    </Box>
  );
}

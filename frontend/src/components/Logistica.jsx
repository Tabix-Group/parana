import React, { useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, TablePagination } from '@mui/material';

const columns = [
  { id: 'id', label: 'ID' },
  { id: 'cliente', label: 'Cliente' },
  { id: 'fecha', label: 'Fecha' },
  { id: 'estado', label: 'Estado' },
  { id: 'transporte', label: 'Transporte' },
];

const pageSizes = [10, 15, 25, 50];

const Logistica = ({ pedidos }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => { setPageSize(+e.target.value); setPage(0); };
  const paginatedPedidos = pedidos.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <>
      <TableContainer sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(34,51,107,0.06)', border: '1px solid', borderColor: 'divider', background: 'background.paper' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: 16 }}>{col.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPedidos && paginatedPedidos.length > 0 ? (
              paginatedPedidos.map((pedido) => (
                <TableRow key={pedido.id} sx={{ background: 'background.paper', '&:hover': { background: '#e8f0fe' } }}>
                  {columns.map(col => (
                    <TableCell key={col.id}>{pedido[col.id]}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                  No hay pedidos para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={pedidos.length}
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

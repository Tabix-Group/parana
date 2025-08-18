import React from 'react';
import { Box, Tabs, Tab, Typography, Grid, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import Pagination from '@mui/material/Pagination';
import API from '../api';

function SummaryKPIs({ pedidos, devoluciones }) {
  const totalPedidos = pedidos.length;
  const pedidosCompletados = pedidos.filter(p => p.completado).length;
  const totalDevoluciones = devoluciones.length;
  const devolucionesRecibidas = devoluciones.filter(d => d.recibido).length;

  const tasaDevolucion = totalPedidos ? ((totalDevoluciones / totalPedidos) * 100).toFixed(2) : '0.00';
  const tasaCompletado = totalPedidos ? ((pedidosCompletados / totalPedidos) * 100).toFixed(2) : '0.00';

  return (
    <Grid container spacing={2}>
      <Grid item xs={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Pedidos totales</Typography>
          <Typography variant="h4">{totalPedidos}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Completados</Typography>
          <Typography variant="h4">{pedidosCompletados} ({tasaCompletado}%)</Typography>
        </Paper>
      </Grid>
      <Grid item xs={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Devoluciones</Typography>
          <Typography variant="h4">{totalDevoluciones}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Devoluciones recibidas</Typography>
          <Typography variant="h4">{devolucionesRecibidas}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Tasa de devolución: {tasaDevolucion}%</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

function PedidosPorFecha({ pedidos }) {
  // Agrupar por fecha_pedido (ISO date)
  const map = {};
  pedidos.forEach(p => {
    const d = p.fecha_pedido || p.fecha_entrega || 'sin_fecha';
    const key = (d || '').toString().split('T')[0];
    map[key] = (map[key] || 0) + 1;
  });
  const rows = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Pedidos</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([fecha, count]) => (
            <TableRow key={fecha}>
              <TableCell>{fecha}</TableCell>
              <TableCell>{count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DevolucionesPorTipo({ devoluciones }) {
  const map = {};
  devoluciones.forEach(d => {
    const t = d.tipo || 'sin_tipo';
    map[t] = (map[t] || 0) + 1;
  });
  const rows = Object.entries(map);
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tipo</TableCell>
            <TableCell>Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([tipo, count]) => (
            <TableRow key={tipo}>
              <TableCell>{tipo}</TableCell>
              <TableCell>{count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TopClientes({ pedidos }) {
  const map = {};
  pedidos.forEach(p => {
    const c = p.cliente_nombre || `cliente_${p.cliente_id || p.Codigo || 'unk'}`;
    map[c] = (map[c] || 0) + 1;
  });
  const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Cliente</TableCell>
            <TableCell>Pedidos</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([cliente, count]) => (
            <TableRow key={cliente}>
              <TableCell>{cliente}</TableCell>
              <TableCell>{count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function AggregateTable({ rows, title }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ p: 2 }}>{title}</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Total bultos</TableCell>
            <TableCell>Pedidos</TableCell>
            <TableCell>Promedio bultos/pedido</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={r.nombre || idx}>
              <TableCell>{r.nombre}</TableCell>
              <TableCell>{r.totalBultos}</TableCell>
              <TableCell>{r.pedidos}</TableCell>
              <TableCell>{(Number(r.totalBultos || 0) / Math.max(1, Number(r.pedidos || 0))).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function Reportes() {
  const [tab, setTab] = React.useState(0);
  const [pedidos, setPedidos] = React.useState([]);
  const [devoluciones, setDevoluciones] = React.useState([]);
  const [aggTransporte, setAggTransporte] = React.useState([]);
  const [aggArmador, setAggArmador] = React.useState([]);
  const [aggVendedor, setAggVendedor] = React.useState([]);
  // Aggregates pagination (client-side)
  const [aggPage, setAggPage] = React.useState(1);
  const [aggPageSize, setAggPageSize] = React.useState(10);
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  // Raw data pagination (server-side)
  const [rawPage, setRawPage] = React.useState(1);
  const [rawPageSize, setRawPageSize] = React.useState(20);
  const [pedidosTotal, setPedidosTotal] = React.useState(0);
  const [devolTotal, setDevolTotal] = React.useState(0);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Traer raw data paginada y agregados
        await Promise.all([
          fetchAggregates(),
          fetchRaw(1, rawPageSize)
        ]);
      } catch (err) {
        console.error('Error cargando datos para reportes', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function fetchAggregates(from = '', to = '') {
    try {
      setLoading(true);
      const [tRes, aRes, vRes] = await Promise.all([
        API.get('/reportes/por-transporte', { params: { from: from || undefined, to: to || undefined } }),
        API.get('/reportes/por-armador', { params: { from: from || undefined, to: to || undefined } }),
        API.get('/reportes/por-vendedor', { params: { from: from || undefined, to: to || undefined } })
      ]);
      setAggTransporte(tRes.data || []);
      setAggArmador(aRes.data || []);
      setAggVendedor(vRes.data || []);
    } catch (err) {
      console.error('Error cargando agregados', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRaw(page = 1, pageSize = 20) {
    try {
      setLoading(true);
      const [pRes, dRes] = await Promise.all([
        API.get('/pedidos', { params: { page, pageSize, sortBy: 'fecha_pedido', order: 'desc' } }),
        API.get('/devoluciones', { params: { page, pageSize, sortBy: 'fecha', order: 'desc' } })
      ]);
      setPedidos(pRes.data.data || pRes.data || []);
      setPedidosTotal(pRes.data.total || 0);
      setDevoluciones(dRes.data.data || dRes.data || []);
      setDevolTotal(dRes.data.total || 0);
    } catch (err) {
      console.error('Error cargando raw data paginada', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          label="Desde"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
        />
        <TextField
          label="Hasta"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={toDate}
          onChange={e => setToDate(e.target.value)}
        />
        <Button variant="contained" onClick={() => fetchAggregates(fromDate, toDate)}>Aplicar</Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Resumen KPIs" />
        <Tab label="Pedidos por fecha" />
        <Tab label="Devoluciones" />
        <Tab label="Top clientes" />
        <Tab label="Por transporte" />
        <Tab label="Por armador" />
        <Tab label="Por vendedor" />
        <Tab label="Raw data" />
      </Tabs>

      {loading && <Typography>Loading...</Typography>}

      {!loading && tab === 0 && (
        <SummaryKPIs pedidos={pedidos} devoluciones={devoluciones} />
      )}

      {!loading && tab === 1 && (
        <PedidosPorFecha pedidos={pedidos} />
      )}

      {!loading && tab === 2 && (
        <DevolucionesPorTipo devoluciones={devoluciones} />
      )}

      {!loading && tab === 3 && (
        <TopClientes pedidos={pedidos} />
      )}

      {!loading && tab === 4 && (
        <Box>
          <AggregateTable rows={aggTransporte.slice((aggPage-1)*aggPageSize, aggPage*aggPageSize)} title="Cantidades por Transporte" />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Pagination count={Math.max(1, Math.ceil((aggTransporte.length||1)/aggPageSize))} page={aggPage} onChange={(_, p) => setAggPage(p)} />
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>Page size</InputLabel>
              <Select value={aggPageSize} label="Page size" onChange={e => { setAggPageSize(Number(e.target.value)); setAggPage(1); }}>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      )}

      {!loading && tab === 5 && (
        <Box>
          <AggregateTable rows={aggArmador.slice((aggPage-1)*aggPageSize, aggPage*aggPageSize)} title="Cantidades por Armador" />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Pagination count={Math.max(1, Math.ceil((aggArmador.length||1)/aggPageSize))} page={aggPage} onChange={(_, p) => setAggPage(p)} />
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>Page size</InputLabel>
              <Select value={aggPageSize} label="Page size" onChange={e => { setAggPageSize(Number(e.target.value)); setAggPage(1); }}>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      )}

      {!loading && tab === 6 && (
        <Box>
          <AggregateTable rows={aggVendedor.slice((aggPage-1)*aggPageSize, aggPage*aggPageSize)} title="Cantidades por Vendedor" />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Pagination count={Math.max(1, Math.ceil((aggVendedor.length||1)/aggPageSize))} page={aggPage} onChange={(_, p) => setAggPage(p)} />
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>Page size</InputLabel>
              <Select value={aggPageSize} label="Page size" onChange={e => { setAggPageSize(Number(e.target.value)); setAggPage(1); }}>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      )}

      {!loading && tab === 7 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Pedidos (raw)</Typography>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Comprobante</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha Pedido</TableCell>
                  <TableCell>Fecha Entrega</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pedidos.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.comprobante}</TableCell>
                    <TableCell>{p.cliente_nombre || p.cliente}</TableCell>
                    <TableCell>{p.fecha_pedido}</TableCell>
                    <TableCell>{p.fecha_entrega}</TableCell>
                    <TableCell>{p.estado_nombre}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Pagination count={Math.max(1, Math.ceil((pedidosTotal||1)/rawPageSize))} page={rawPage} onChange={(_, p) => { setRawPage(p); fetchRaw(p, rawPageSize); }} />
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>Page size</InputLabel>
              <Select value={rawPageSize} label="Page size" onChange={e => { setRawPageSize(Number(e.target.value)); setRawPage(1); fetchRaw(1, Number(e.target.value)); }}>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="h6" sx={{ mt: 2 }}>Devoluciones (raw)</Typography>
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Pedido</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Recibido</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devoluciones.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.id}</TableCell>
                    <TableCell>{d.pedido_id}</TableCell>
                    <TableCell>{d.cliente_id}</TableCell>
                    <TableCell>{d.tipo}</TableCell>
                    <TableCell>{d.recibido ? 'Sí' : 'No'}</TableCell>
                    <TableCell>{d.fecha}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

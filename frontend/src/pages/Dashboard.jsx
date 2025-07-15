import React from 'react';
import { Tabs, Tab, Box, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import Pedidos from '../components/Pedidos';
import Clientes from '../components/Clientes';
import Armadores from '../components/Armadores';
import Transportes from '../components/Transportes';
import TiposTransporte from '../components/TiposTransporte';
import Vendedores from '../components/Vendedores';
import Estados from '../components/Estados';
import Usuarios from '../components/Usuarios';

export default function Dashboard() {
  const [tab, setTab] = React.useState(0);
  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} textColor="primary" indicatorColor="primary">
        <Tab label="Clientes" />
        <Tab label="Armadores" />
        <Tab label="Transportes" />
        <Tab label="Tipos de Transporte" />
        <Tab label="Vendedores" />
        <Tab label="Estados" />
        <Tab label="Usuarios" />
      </Tabs>
      <div>
        {tab === 0 && <Clientes />}
        {tab === 1 && <Armadores />}
        {tab === 2 && <Transportes />}
        {tab === 3 && <TiposTransporte />}
        {tab === 4 && <Vendedores />}
        {tab === 5 && <Estados />}
        {tab === 6 && <Usuarios />}
      </div>
    </Box>
  );
}

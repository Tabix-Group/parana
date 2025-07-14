import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import Pedidos from '../components/Pedidos';
import Clientes from '../components/Clientes';
import Armadores from '../components/Armadores';
import Transportes from '../components/Transportes';
import TiposTransporte from '../components/TiposTransporte';
import Vendedores from '../components/Vendedores';
import Estados from '../components/Estados';

export default function Dashboard() {
  const [tab, setTab] = React.useState(0);
  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Pedidos" />
        <Tab label="Clientes" />
        <Tab label="Armadores" />
        <Tab label="Transportes" />
        <Tab label="Tipos de Transporte" />
        <Tab label="Vendedores" />
        <Tab label="Estados" />
      </Tabs>
      {tab === 0 && <Pedidos />}
      {tab === 1 && <Clientes />}
      {tab === 2 && <Armadores />}
      {tab === 3 && <Transportes />}
      {tab === 4 && <TiposTransporte />}
      {tab === 5 && <Vendedores />}
      {tab === 6 && <Estados />}
    </Box>
  );
}

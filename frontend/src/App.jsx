import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PedidosTotales from './pages/PedidosTotales';
import PedidosParciales from './pages/PedidosParciales';
import Devoluciones from './pages/Devoluciones';
import Layout from './components/Layout';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pedidos-totales" element={<PedidosTotales />} />
          <Route path="/parciales" element={<PedidosParciales />} />
          <Route path="/devoluciones" element={<Devoluciones />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

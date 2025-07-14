import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PedidosParciales from './pages/PedidosParciales';
import Devoluciones from './pages/Devoluciones';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/parciales" element={<PedidosParciales />} />
        <Route path="/devoluciones" element={<Devoluciones />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

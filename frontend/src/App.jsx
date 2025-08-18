import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PedidosTotales from './pages/PedidosTotales';
import PedidosParciales from './pages/PedidosParciales';
import Devoluciones from './pages/Devoluciones';
import RetiranPage from './pages/Retiran';
import Layout from './components/Layout';
import LogisticaPage from './pages/Logistica';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, useAuth } from './auth.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/*" element={<ProtectedLayout />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

function LoginWrapper() {
  const { user, login } = useAuth();
  if (user) return <Navigate to="/pedidos-totales" replace />;
  return <Login onLogin={login} />;
}

function ProtectedLayout() {
  return (
    <PrivateRoute>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pedidos-totales" element={<PedidosTotales />} />
          <Route path="/parciales" element={<PedidosParciales />} />
          <Route path="/devoluciones" element={<Devoluciones />} />
          <Route path="/retiran" element={<RetiranPage />} />
          <Route path="/logistica" element={<LogisticaPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </PrivateRoute>
  );
}

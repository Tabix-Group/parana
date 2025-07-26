
import React, { useEffect, useState } from 'react';
import Logistica from '../components/Logistica';
import API from '../api';

export default function LogisticaPage() {
  const [pedidos, setPedidos] = useState([]);
  useEffect(() => {
    API.get('/pedidos').then(res => setPedidos(res.data.data || []));
  }, []);
  return <Logistica pedidos={pedidos} />;
}


import React, { useEffect, useState } from 'react';
import Logistica from '../components/Logistica';
import API from '../api';

export default function LogisticaPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get('/pedidos'),
      API.get('/devoluciones')
    ]).then(([resPedidos, resDevoluciones]) => {
      const pedidos = (resPedidos.data.data || []).map(p => ({
        ...p,
        origen: 'Pedido',
        comprobante: p.comprobante || '',
        cliente: p.cliente_nombre || p.cliente || '',
        direccion: p.direccion || '',
        cantidad: p.cant_bultos ?? '',
        tipo: p.tipo_bultos || '',
        fecha: p.fecha_entrega || p.fecha || '',
        estado: p.estado_nombre || p.estado || '',
        transporte: p.transporte_nombre || p.transporte || '',
      }));
      const devoluciones = (resDevoluciones.data.data || []).map(d => ({
        ...d,
        origen: 'Devolución',
        comprobante: d.comprobante || `DEV-${d.id}`,
        cliente: d.cliente_id || '',
        direccion: '',
        cantidad: '',
        tipo: d.tipo || '',
        tipo_devolucion: d.tipo_devolucion || '',
        fecha: d.fecha || '',
        estado: '',
        transporte: '',
      }));
      setData([...pedidos, ...devoluciones]);
      setLoading(false);
    });
  }, []);

  return <Logistica pedidos={data} loading={loading} />;
}

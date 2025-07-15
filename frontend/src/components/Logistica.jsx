import React from "react";
import "../App.css";

// Vista de solo visualización, idéntica a PedidosTotales pero sin edición/eliminación
const Logistica = ({ pedidos }) => {
  return (
    <div className="container">
      <h2>Logística</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Transporte</th>
            {/* Agrega más columnas según sea necesario */}
          </tr>
        </thead>
        <tbody>
          {pedidos && pedidos.length > 0 ? (
            pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>{pedido.id}</td>
                <td>{pedido.cliente}</td>
                <td>{pedido.fecha}</td>
                <td>{pedido.estado}</td>
                <td>{pedido.transporte}</td>
                {/* Más campos si es necesario */}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No hay pedidos para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Logistica;

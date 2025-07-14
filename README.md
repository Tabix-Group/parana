# Seguimiento de Pedidos

Este proyecto contiene:

- `/backend`: API RESTful en Node.js (Express) con base de datos SQLite (migrable a PostgreSQL).
- `/frontend`: Aplicación web en React (Vite) para gestión y seguimiento de pedidos y entidades relacionadas.

## Instalación y uso

### Backend
1. Ir a la carpeta `backend`
2. Instalar dependencias: `npm install`
3. Iniciar el servidor: `npm run dev`

### Frontend
1. Ir a la carpeta `frontend`
2. Instalar dependencias: `npm install`
3. Iniciar la app: `npm run dev`

## Funcionalidades
- CRUD de Pedidos, Clientes, Armadores, Transportes, Tipos de Transporte, Vendedores, Estados y Devoluciones
- Listados con paginación, filtros y orden
- Dashboard con solapas para cada entidad
- Vistas especiales para pedidos parciales y devoluciones

## Notas
- La base de datos es SQLite para desarrollo local. Se puede migrar a PostgreSQL fácilmente.
- El frontend y backend están desacoplados y se comunican por API REST.

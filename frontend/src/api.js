import axios from 'axios';

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Si termina en /, quítalo para evitar doble barra
    const cleanUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    // Si ya incluye /api al final, úsalo tal cual, si no, agrégalo
    return cleanUrl.endsWith('/api') ? cleanUrl : cleanUrl + '/api';
  }
  return 'http://localhost:4000/api';
}

const API = axios.create({
  baseURL: getApiBaseUrl(),
});

export default API;

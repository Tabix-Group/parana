import axios from 'axios';

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    // Si termina en /, quítalo para evitar doble barra
    const cleanUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    // Si ya incluye /api al final, úsalo tal cual, si no, agrégalo
    const finalUrl = cleanUrl.endsWith('/api') ? cleanUrl : cleanUrl + '/api';

    console.log('🔗 API URL from environment:', envUrl);
    console.log('🔗 Final API base URL:', finalUrl);

    return finalUrl;
  }

  const defaultUrl = 'http://localhost:4000/api';
  console.log('🔗 Using default API URL:', defaultUrl);
  return defaultUrl;
}

const API = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000, // 10 segundos timeout
});

// Interceptor para logging de requests
API.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de responses
API.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default API;

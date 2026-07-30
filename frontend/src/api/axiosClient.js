import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

// Injeta o token JWT em toda requisição, e evita que respostas GET fiquem
// em cache (navegador ou proxy no caminho) — sem isso, telas de listagem
// podiam mostrar dados desatualizados até a página ser recarregada manualmente.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admstudio_access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if ((config.method || 'get').toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
    config.params = { ...(config.params || {}), _ts: Date.now() };
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `[ADMSTUDIO] Erro ${error.response.status} em ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
        error.response.data,
      );
    } else {
      console.error(`[ADMSTUDIO] Falha de rede/CORS ao chamar ${error.config?.url}:`, error.message);
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admstudio_access');
      localStorage.removeItem('admstudio_refresh');
      localStorage.removeItem('admstudio_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

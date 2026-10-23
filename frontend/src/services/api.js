import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({ baseURL: BASE_URL });

const viderSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

const redirigerVersConnexion = () => {
  viderSession();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
};

const rafraichirJeton = async () => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) throw new Error('Aucun jeton de rafraîchissement');
  const { data } = await axios.post(`${BASE_URL}token/refresh/`, { refresh });
  localStorage.setItem('access_token', data.access);
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
  return data.access;
};

// Un seul rafraîchissement à la fois : les requêtes 401 simultanées attendent
// la même promesse au lieu de lancer plusieurs appels.
let rafraichissementEnCours = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requete = error.config;
    const url = requete?.url || '';
    const estAuthentification = url.includes('token/');

    if (
      error.response?.status === 401 &&
      requete &&
      !requete._retry &&
      !estAuthentification
    ) {
      requete._retry = true;
      try {
        if (!rafraichissementEnCours) {
          rafraichissementEnCours = rafraichirJeton().finally(() => {
            rafraichissementEnCours = null;
          });
        }
        const nouveauJeton = await rafraichissementEnCours;
        requete.headers = {
          ...requete.headers,
          Authorization: `Bearer ${nouveauJeton}`,
        };
        return api(requete);
      } catch {
        redirigerVersConnexion();
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !estAuthentification) {
      redirigerVersConnexion();
    }

    return Promise.reject(error);
  }
);

export default api;

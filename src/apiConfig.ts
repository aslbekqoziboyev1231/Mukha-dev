// API Base URL for the backend. 
// When deploying to Render, replace the empty string with your Render URL (e.g., 'https://your-app.onrender.com')
export const API_BASE_URL = 'https://mukha-dev.onrender.com'; 

export const getApiUrl = (path: string) => {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

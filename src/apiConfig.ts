// API Base URL for the backend. 
// When deploying to Render on the same origin, leave this empty to use relative paths.
export const API_BASE_URL = ''; 

export const getApiUrl = (path: string) => {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

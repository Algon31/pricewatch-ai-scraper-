import axios from 'axios';

// Configurable base URL. Defaults to relative '/api' (handled by Vite proxy) or fallback to 'http://localhost:5000/api'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Scrape a product URL via POST /api/scrape
 */
export async function scrapeProduct(url) {
  const response = await api.post('/scrape', { url });
  return response.data;
}

/**
 * Fetch all tracked products via GET /api/products
 */
export async function getProducts() {
  const response = await api.get('/products');
  return response.data;
}

/**
 * Fetch a single product with full price history via GET /api/products/:id
 */
export async function getProductById(id) {
  const response = await api.get(`/products/${id}`);
  return response.data;
}

export default api;

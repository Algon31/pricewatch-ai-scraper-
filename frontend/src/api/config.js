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
 * Compare competitor product prices across multiple URLs via POST /api/products/compare
 */
export async function compareProducts(urls) {
  const response = await api.post('/products/compare', { urls });
  return response.data;
}

/**
 * Create a new monitored product via POST /api/monitors
 */
export async function createMonitor(name, urls) {
  const response = await api.post('/monitors', { name, urls });
  return response.data;
}

/**
 * Fetch all monitored products via GET /api/monitors
 */
export async function getMonitors() {
  const response = await api.get('/monitors');
  return response.data;
}

/**
 * Fetch single monitored product with full price history & change events via GET /api/monitors/:id
 */
export async function getMonitorById(id) {
  const response = await api.get(`/monitors/${id}`);
  return response.data;
}

/**
 * Trigger re-scrape and change detection check for a monitor via POST /api/monitors/:id/check
 */
export async function checkMonitor(id) {
  const response = await api.post(`/monitors/${id}/check`);
  return response.data;
}

/**
 * Delete a monitored product and its associated historical snapshots via DELETE /api/monitors/:id
 */
export async function deleteMonitor(id) {
  const response = await api.delete(`/monitors/${id}`);
  return response.data;
}

/**
 * Scrape a single product URL via POST /api/scrape
 */
export async function scrapeProduct(url) {
  const response = await api.post('/scrape', { url });
  return response.data;
}

/**
 * Fetch all tracked single products via GET /api/products
 */
export async function getProducts() {
  const response = await api.get('/products');
  return response.data;
}

/**
 * Fetch a single product with price history via GET /api/products/:id
 */
export async function getProductById(id) {
  const response = await api.get(`/products/${id}`);
  return response.data;
}

export default api;

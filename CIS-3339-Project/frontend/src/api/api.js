import axios from 'axios';
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_ROOT_API,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}
export function setAuthHeader(token) {
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
}
export function logoutUser() {
  localStorage.removeItem('authToken');
  delete apiClient.defaults.headers.common.Authorization;
}
// The interceptor alone translates response/network failures to one Error shape.
export function normalizeApiError(error) {
  const body = error.response?.data;
  const text = typeof body === 'string' ? body : body?.error || body?.message;
  const normalized = new Error(
    !error.response
      ? 'Unable to reach the server'
      : typeof text === 'string'
        ? text
        : 'Request failed. Please try again.'
  );
  normalized.status = error.response?.status || 0;
  return normalized;
}
apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/users/login')
    ) {
      logoutUser();
      onUnauthorized();
    }
    return Promise.reject(normalizeApiError(error));
  }
);
export async function loginUser(username, password) {
  const { data } = await apiClient.post('/users/login', { username, password });
  localStorage.setItem('authToken', data.token);
  setAuthHeader(data.token);
  return data.token;
}
const get = async (url, params) => (await apiClient.get(url, { params })).data;
const fields = (body, keys) =>
  Object.fromEntries(
    keys.filter((k) => Object.hasOwn(body, k)).map((k) => [k, body[k]])
  );
const clientBody = (b) =>
  fields(b, [
    'firstName',
    'middleName',
    'lastName',
    'email',
    'phoneNumber',
    'address'
  ]);
const eventBody = (b) =>
  fields(b, ['name', 'description', 'date', 'services', 'address']);
const serviceBody = (b) => fields(b, ['name', 'description', 'status']);
const create = async (url, body) =>
  (await apiClient.post(url, body)).data.message;
const update = async (url, body) =>
  (await apiClient.put(url, body)).data.message;
const remove = async (url) => (await apiClient.delete(url)).data.message;
export const getOrgName = () => get('/org');
export const getClients = () => get('/clients');
export const getClientById = (id) => get(`/clients/id/${id}`);
export const searchClients = (q) => get('/clients/search', q);
export const createClient = (b) => create('/clients', clientBody(b));
export const updateClient = (id, b) =>
  update(`/clients/update/${id}`, clientBody(b));
export const deleteClientbyId = (id) => remove(`/clients/${id}`);
export const getClientsByZipCode = () => get('/clients/byzip');
export const getEvents = () => get('/events');
export const getEventById = (id) => get(`/events/id/${id}`);
export const searchEvents = (q) => get('/events/search', q);
export const createEvent = (b) => create('/events', eventBody(b));
export const updateEvent = (id, b) =>
  update(`/events/update/${id}`, eventBody(b));
export const deleteEvent = (id) => remove(`/events/${id}`);
export const getAttendance = () => get('/events/attendance');
export const getClientEvents = (id) => get(`/events/client/${id}`);
export const getNonClientEvents = (id) =>
  get(`/events/client/${id}/not-registered`);
export const getEventAttendees = (id) => get(`/events/attendees/${id}`);
export const getEventsByServiceId = (id) => get(`/events/service/${id}`);
export async function registerAttendee(event, client) {
  const { data } = await apiClient.put(
    '/events/register',
    {},
    { params: { event, client } }
  );
  return data.message || 'Client added to event';
}
export async function deregisterAttendee(event, client) {
  const { data } = await apiClient.put(
    '/events/deregister',
    {},
    { params: { event, client } }
  );
  return data.message || 'Client removed from event';
}
export const getServices = () => get('/services');
export const getServiceById = (id) => get(`/services/id/${id}`);
export const searchServices = (q) => get('/services/search', q);
export const createService = (b) => create('/services', serviceBody(b));
export const updateService = (id, b) =>
  update(`/services/update/${id}`, serviceBody(b));
export const deleteService = (id) => remove(`/services/${id}`);
export default apiClient;

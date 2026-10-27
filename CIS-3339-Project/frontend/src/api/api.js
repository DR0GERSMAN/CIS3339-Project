// This file contains all API calls to the API endpoints
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_ROOT_API,
  headers: {
    'Content-Type': 'application/json'
  }
});

function setAuthHeader(token) {
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
}

function removeAuthHeader() {
  delete apiClient.defaults.headers.common.Authorization;
}

export function formatErrorMessage(error) {
  if (!error) return 'Something went wrong.';

  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error?.message === 'string') return error.message;

  const responseData = error?.response?.data;
  if (typeof responseData === 'string') return responseData;
  if (responseData?.message) return responseData.message;
  if (responseData?.error) return responseData.error;

  return 'Something went wrong.';
}

export function normalizeApiError(error) {
  if (!error || !error.response) {
    return new Error('Cannot reach the server. Please try again later.');
  }

  const message = formatErrorMessage(error);
  return new Error(message);
}

export function isTokenExpired(token) {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function restoreAuthSession() {
  const token = localStorage.getItem('authToken');

  if (!token || isTokenExpired(token)) {
    logoutUser();
    return null;
  }

  setAuthHeader(token);
  return token;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      logoutUser();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(normalizeApiError(error));
  }
);

export async function loginUser(username, password) {
  try {
    const response = await apiClient.post('/users/login', { username, password });
    const token = response.data.token;
    localStorage.setItem('authToken', token);
    setAuthHeader(token);
    return token;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function logoutUser() {
  localStorage.removeItem('authToken');
  removeAuthHeader();
}

export async function getOrgName() {
  const response = await apiClient.get('/org');
  return response.data;
}

export const getEvents = async () => {
  try {
    const response = await apiClient.get('/events/');
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getEventById = async (id) => {
  try {
    const response = await apiClient.get(`/events/id/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const searchEvents = async (query) => {
  try {
    const params = {};
    if (query.searchBy === 'name') {
      params.searchBy = query.searchBy;
      params.name = query.name || '';
    } else if (query.searchBy === 'date') {
      params.searchBy = 'date';
      params.eventDate = query.eventDate || '';
    }
    const response = await apiClient.get('/events/search', { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getClientEvents = async (id) => {
  try {
    const response = await apiClient.get(`/events/client/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getNonClientEvents = async (id) => {
  try {
    const response = await apiClient.get(`/events/client/${id}/not-registered`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getEventAttendees = async (id) => {
  try {
    const response = await apiClient.get(`/events/attendees/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getEventsByServiceId = async (id) => {
  try {
    const response = await apiClient.get(`/events/service/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await apiClient.post('/events/', eventData);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    const response = await apiClient.put(`/events/update/${id}`, eventData);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const registerAttendee = async (eventId, clientId) => {
  try {
    const response = await apiClient.put(
      '/events/register',
      {},
      {
        params: {
          event: eventId,
          client: clientId
        }
      }
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const deregisterAttendee = async (eventId, clientId) => {
  try {
    const response = await apiClient.put(
      '/events/deregister',
      {},
      {
        params: {
          event: eventId,
          client: clientId
        }
      }
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const deleteEvent = async (id) => {
  try {
    const response = await apiClient.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getAttendance = async () => {
  try {
    const response = await apiClient.get('/events/attendance');
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getClientsByZipCode = async () => {
  try {
    const response = await apiClient.get('/clients/byzip');
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getClients = async () => {
  try {
    const response = await apiClient.get('/clients/');
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const searchClients = async (query) => {
  try {
    const params = {};
    if (query.searchBy === 'name') {
      params.searchBy = query.searchBy;
      params.firstName = query.firstName || '';
      params.lastName = query.lastName || '';
    } else if (query.searchBy === 'number') {
      params.searchBy = query.searchBy;
      params.phoneNumber = query.phoneNumber || '';
    }
    const response = await apiClient.get('/clients/search', { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getClientById = async (id) => {
  try {
    const response = await apiClient.get(`/clients/id/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const createClient = async (clientData) => {
  try {
    const response = await apiClient.post('/clients/', clientData);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const updateClient = async (id, clientData) => {
  try {
    const response = await apiClient.put(`/clients/update/${id}`, clientData);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const deleteClientbyId = async (id) => {
  try {
    const response = await apiClient.delete(`/clients/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getServices = async () => {
  try {
    const response = await apiClient.get('/services/');
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const getServiceById = async (id) => {
  try {
    const response = await apiClient.get(`/services/id/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const searchServices = async (query) => {
  try {
    const params = {};
    if (query.searchBy === 'name') {
      params.searchBy = query.searchBy;
      params.name = query.name || '';
    } else if (query.searchBy === 'description') {
      params.searchBy = query.searchBy;
      params.description = query.description || '';
    }
    const response = await apiClient.get('/services/search', { params });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const createService = async (serviceData) => {
  try {
    const response = await apiClient.post('/services/', serviceData);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const updateService = async (id, serviceData) => {
  try {
    const response = await apiClient.put(`/services/update/${id}`, serviceData);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const deleteService = async (id) => {
  try {
    const response = await apiClient.delete(`/services/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

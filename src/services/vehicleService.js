import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/config';

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
};

export const normalizeVehiclePayload = (data = {}) => ({
  vehicle_no: (data.vehicle_no || data.vehicleNo || data.vehicleNumber || data.registrationNo || '').toString().trim(),
  vehicle_name: (data.vehicle_name || data.vehicleName || data.name || '').toString().trim(),
  vehicle_owner: (data.vehicle_owner || data.vehicleOwner || data.owner_name || data.owner || '').toString().trim(),
  description: (data.description || '').toString().trim(),
  status: ((data.status || data.vehicle_status || 'ACTIVE').toString().trim().toUpperCase()),
});

export const getVehicleApiHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const getVehicleApiBaseUrl = () => CONFIG.API_BASE_URL;

export const getStoredToken = async () => AsyncStorage.getItem('userToken');

export const requestVehicleApi = async (path, options = {}, token) => {
  const response = await fetch(`${getVehicleApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      ...getVehicleApiHeaders(token),
      ...(options.headers || {}),
    },
  });

  const data = await parseJsonSafely(response);
  return { response, data };
};

export const getVehicles = async (token) => requestVehicleApi('/api/admin/vehicles', { method: 'GET' }, token);

export const createVehicle = async (token, vehicleData) => {
  const payload = normalizeVehiclePayload(vehicleData);
  return requestVehicleApi('/api/admin/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
};

export const updateVehicle = async (token, vehicleId, vehicleData) => {
  const payload = normalizeVehiclePayload(vehicleData);
  return requestVehicleApi(`/api/admin/vehicles/${vehicleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
};

export const deleteVehicle = async (token, vehicleId) => requestVehicleApi(`/api/admin/vehicles/${vehicleId}`, { method: 'DELETE' }, token);

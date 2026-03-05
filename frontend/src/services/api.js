import axios from 'axios';

const normalizeBase = (rawValue) => {
  const fallback = 'http://localhost:5000';
  if (!rawValue || typeof rawValue !== 'string') {
    return fallback;
  }

  let value = rawValue.trim().replace(/\/+$/, '');

  if (/^https?:\/\/localhost:3000(\/|$)/i.test(value)) {
    value = value.replace(/^https?:\/\/localhost:3000/i, 'http://localhost:5000');
  }

  value = value.replace(/\/api\/users$/i, '');

  return value || fallback;
};

const BASE = normalizeBase(process.env.REACT_APP_API_URL);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const method = (error?.config?.method || 'request').toUpperCase();
    const url = error?.config?.url || 'unknown-url';
    const backendError = error?.response?.data?.error || error?.response?.data?.message;
    if (status) {
      error.message = `${method} ${url} failed with ${status}${backendError ? `: ${backendError}` : ''}`;
    }
    return Promise.reject(error);
  }
);

const listGet = (path, params) =>
  axios.get(`${BASE}${path}`, { params }).then((res) => ({
    ...res,
    data: res?.data?.data ?? res?.data ?? [],
  }));

const unsupported = (message) => Promise.reject(new Error(message));

export const donorApi = {
  register: (data) => axios.post(`${BASE}/api/users/donor`, data),
  registerDonor: (data) => axios.post(`${BASE}/api/users/donor`, data),
  getDonor: (params) => axios.get(`${BASE}/api/users/donor`, { params }),
  getAll: (params) => listGet('/api/users/allDonor', params),
  getAllDonors: (params) => listGet('/api/users/allDonor', params),
};

export const ngoApi = {
  register: (data) => axios.post(`${BASE}/api/users/ngo`, data),
  registerNGO: (data) => axios.post(`${BASE}/api/users/ngo`, data),
  getNGO: (params) => axios.get(`${BASE}/api/users/ngo`, { params }),
  getAll: (params) => listGet('/api/users/allNGO', params),
  getAllNGOs: (params) => listGet('/api/users/allNGO', params),
  createFund: (data) => axios.post(`${BASE}/api/funds`, data),
  getAllFunds: (params) => listGet('/api/funds', params),
};

export const bankApi = {
  register: (data) => axios.post(`${BASE}/api/users/bank`, data),
  registerBank: (data) => axios.post(`${BASE}/api/users/bank`, data),
  getBank: (params) => axios.get(`${BASE}/api/users/bank`, { params }),
  getAll: (params) => listGet('/api/users/allBank', params),
  getAllBanks: (params) => listGet('/api/users/allBank', params),
};

export const govUserApi = {
  register: (data) => axios.post(`${BASE}/api/users/gov-user`, data),
  registerUser: (data) => axios.post(`${BASE}/api/users/gov-user`, data),
  getAll: (params) => listGet('/api/users/gov-user', params),
  login: () => unsupported('No backend endpoint for gov user login.'),
};

export const fundApi = {
  create: (data) => axios.post(`${BASE}/api/funds`, data),
  getAll: (params) => listGet('/api/funds', params),
  getFund: (fundId, params) => axios.get(`${BASE}/api/funds/${fundId}`, { params }),
  getByNGO: (ngoId, params) => listGet(`/api/funds/ngo/${ngoId}/funds`, params),
  getByDonor: (donorId, params) => listGet(`/api/funds/donor/${donorId}/donations`, params),
  closeFund: (fundId, params) => axios.get(`${BASE}/api/funds/${fundId}/close`, { params }),
  donate: (data) => {
    const { fundId, ...rest } = data;
    return axios.post(`${BASE}/api/funds/${fundId}/donate`, rest);
  },
  donateOneShot: (data) => {
    const { fundId, ...rest } = data;
    return axios.post(`${BASE}/api/funds/${fundId}/donate-one-shot`, rest);
  },
  addExpense: (fundId, data) => axios.post(`${BASE}/api/funds/${fundId}/expense`, data),
};

export const tokenApi = {
  issue: (data) => axios.post(`${BASE}/api/tokens/issue`, data),
  transfer: (data) => axios.post(`${BASE}/api/tokens/transfer`, data),
  redeem: (data) => axios.post(`${BASE}/api/tokens/redeem`, data),
  getByBank: (data) => axios.post(`${BASE}/api/tokens/byBank`, data),
  getByOwner: (params) => listGet('/api/tokens/byOwner', params),
  getByDonor: (params) => listGet('/api/tokens/byDonor', params),
};

export const getUserCert = () => unsupported('No backend endpoint for fetching user cert. Provide userCert manually.');

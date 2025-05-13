import axiosInstance from './axios';
import { authApi } from './authApi';
import { patientApi } from './patientApi';
import { visitApi } from './visitApi';
import { fileApi } from './fileApi';
import { userApi } from './userApi';

export {
  axiosInstance,
  authApi,
  patientApi,
  visitApi,
  fileApi,
  userApi
};

export default axiosInstance;
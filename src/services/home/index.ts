import httpService from '../https.service';

// New Endpoints for ROVE
const getUserData = () => {
  return httpService().get(`accounts/profile/`);
};
const updateUser = (body: any) => {
  return httpService('multipart/form-data').put(`accounts/profile/`, body);
};

const getTrustedContacts = () => {
  return httpService().get('accounts/trusted-contacts/');
};

const editTrustedContact = (id: any, body: any) => {
  return httpService().put(`accounts/trusted-contacts/${id}/`, body);
};

const deleteTrustedContact = (id: any) => {
  return httpService().delete(`accounts/trusted-contacts/${id}/`);
};

const addTrustedContact = (body: any) => {
  return httpService().post('accounts/trusted-contacts/', body);
};

const getAgoraToken = (body: any) => {
  return httpService().post('accounts/fetch-rtc-token/', body);
};

const postMsg = (body: any) => {
  return httpService().post('accounts/stream/send-msg/', body);
};

const createSafeZones = (body: any) => {
  return httpService().post('accounts/safezones/', body);
};

const getSafeZones = () => {
  return httpService().get('accounts/safezones/');
};

const deleteSafeZone = (id: any) => {
  return httpService().delete(`accounts/safezones/${id}/`);
};

const postIncidents = (body: any) => {
  return httpService().post('incidents/incidents/', body);
};

const getIncidents = () => {
  return httpService().get('incidents/incidents/');
};

const deleteIncident = (id: any) => {
  return httpService().delete(`incidents/incidents/${id}/`);
};

const getIncidentDetail = (id: any) => {
  return httpService().get(`incidents/incidents/${id}/`);
};

export const HomeAPIS = {
  // New Endpoints
  getTrustedContacts,
  addTrustedContact,
  getUserData,
  updateUser,
  getAgoraToken,
  postMsg,
  editTrustedContact,
  deleteTrustedContact,
  createSafeZones,
  getSafeZones,
  deleteSafeZone,
  postIncidents,
  getIncidents,
  deleteIncident,
  getIncidentDetail,
};

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

const startRecording = (body: any) => {
  return httpService().post('incidents/start-recording/', body);
};

const stopRecording = (body: any) => {
  return httpService().post('incidents/stop-recording/', body);
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

const sendFeedback = (body: any) => {
  return httpService().post('incidents/feedback/', body);
};

const sendThreatReports = (body: any) => {
  const formData = new FormData();

  // Add regular fields as strings
  formData.append('user_id', body.user_id);
  formData.append('location', body.location);
  formData.append('latitude', body.latitude);
  formData.append('longitude', body.longitude);
  formData.append('timestamp', body.timestamp);
  formData.append('description', body.description);
  formData.append('report_type', body.report_type);

  // Add image as binary data if it exists
  if (body.photo) {
    formData.append('photo', {
      uri: body.photo,
      type: 'image/jpeg', // or determine from file extension
      name: `threat_image_${Date.now()}.jpg`,
    } as any);
  }

  return httpService().post('threat_reports/threat_reports/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const getThreatReports = (latitude?: number, longitude?: number) => {
  let url = 'threat_reports/threat_reports/';

  // Add query parameters if latitude and longitude are provided
  if (latitude !== undefined && longitude !== undefined) {
    url += `?latitude=${latitude}&longitude=${longitude}`;
  }

  console.log('urlLLLLLLLLlll', url)  
  return httpService().get(url);
};

const voteThreatReport = (id: any, body: any) => {
  return httpService().post(`threat_reports/threat_reports/${id}/vote/`, body);
};

// const getThreatReports = () => {
//   return httpService().get('threat_reports/threat_reports/');
// };

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
  startRecording,
  stopRecording,
  sendFeedback,
  sendThreatReports,
  getThreatReports,
  voteThreatReport,
};

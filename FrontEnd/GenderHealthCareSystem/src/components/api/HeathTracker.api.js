import apiClient from "./apiClient";

export const healthTrackerAPI = async (values) => {
  return apiClient.post("/menstrual/calculate", values);
};

export const updateTrackerAPI = async (values) => {
  return apiClient.post("/menstrual/update", values);
};

export const menstrualHistoryAPI = () => {
  return apiClient.get("/menstrual/calendar/me");
};

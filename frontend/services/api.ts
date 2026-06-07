import axios from "axios";

const API_BASE = "http://localhost:8000/api";

export const uploadReport = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${API_BASE}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const analyzeReport = async (reportId: number) => {
  const res = await axios.post(`${API_BASE}/analyze/${reportId}`);
  return res.data;
};

export const getReports = async () => {
  const res = await axios.get(`${API_BASE}/reports`);
  return res.data;
};

export const getReport = async (reportId: number) => {
  const res = await axios.get(`${API_BASE}/reports/${reportId}`);
  return res.data;
};

export const chatWithReports = async (question: string, reportId?: number) => {
  const res = await axios.post(`${API_BASE}/chat`, {
    question,
    report_id: reportId,
  });
  return res.data;
};
import axios from "axios";
const API_BASE = "http://localhost:4000/api";

export const getContestants = () => axios.get(`${API_BASE}/contestants`);
export const addContestant = (data) => axios.post(`${API_BASE}/contestants`, data);
export const deleteContestant = (id) => axios.delete(`${API_BASE}/contestants/${id}`);
export const getRanking = () => axios.get(`${API_BASE}/ranking`);
export const setScene = (scene) => axios.post(`${API_BASE}/scene`, scene);
export const getScene = () => axios.get(`${API_BASE}/scene`);
export const getSongs = () => axios.get(`${API_BASE}/songs`);
export const postPitch = (data) => axios.post(`${API_BASE}/pitch`, data);
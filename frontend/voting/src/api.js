import axios from "axios";
const API_BASE = "http://localhost:4000/api";

export const getContestants = () => axios.get(`${API_BASE}/contestants`);
export const getScene = () => axios.get(`${API_BASE}/scene`);
export const postVote = (vote) => axios.post(`${API_BASE}/vote`, vote);
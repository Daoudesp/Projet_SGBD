import axios from 'axios';

// Toutes les requêtes pointent vers Flask (port 5000)
const instance = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  headers: { 'Content-Type': 'application/json' }
});

export default instance;

// API base URL configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001'
  : (window.location.hostname.includes('192.168.') || window.location.hostname.includes('10.') || window.location.hostname.includes('172.'))
    ? `http://${window.location.hostname}:5001`
    : 'https://amigowebster.in/acbiiling';

export { API_URL };

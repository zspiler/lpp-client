const axios = require('axios');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config();

const { LPP_API_BASE_URL } = require('./constants');

const axiosInstance = axios.create({
    baseURL: LPP_API_BASE_URL,
    headers: { apikey: process.env.LPP_API_KEY },
    timeout: 30000,
    httpsAgent: new https.Agent({ keepAlive: true }),
});

module.exports = axiosInstance;

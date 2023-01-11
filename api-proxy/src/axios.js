const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const { LPP_API_BASE_URL } = require('./constants');

const axiosInstance = axios.create({
    baseURL: LPP_API_BASE_URL,
    headers: { apikey: process.env.LPP_API_KEY },
});

module.exports = axiosInstance;

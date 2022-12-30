const needle = require('needle');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apicache = require('apicache');

const cache = apicache.middleware;

dotenv.config();

const LPP_API_BASE_URL = 'https://data.lpp.si';

const app = express();
app.use(cors());

const options = { headers: { apikey: process.env.LPP_API_KEY } };

async function proxyRequest(req, res, next) {
  try {
    const apiRes = await needle('get', `${LPP_API_BASE_URL}${req.url}`, options);
    const data = apiRes.body;
    console.log(`${LPP_API_BASE_URL}${req.url}`);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

app.get('/api/station/arrival*', cache('10 seconds'), proxyRequest);
app.get('/api/bus/buses-on-route*', cache('10 seconds'), proxyRequest);
app.get('/api/route/routes*', cache('1 day'), proxyRequest);
app.get('*', proxyRequest);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Proxy listening on port ${port} ...`));

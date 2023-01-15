const express = require('express');
const cors = require('cors');
const apicache = require('apicache');

const cache = apicache.middleware;

const { proxyRequest, getBusesOnRoutes } = require('./middleware');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/station/arrival*', cache('10 seconds'), proxyRequest);
app.get('/api/bus/buses-on-route*', cache('5 seconds'), proxyRequest);
app.get('/api/buses-on-routes', cache('5 seconds'), getBusesOnRoutes);

app.get('/api/route/routes*', cache('1 day'), proxyRequest);
app.get('*', proxyRequest);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Proxy listening on port ${port} ...`));

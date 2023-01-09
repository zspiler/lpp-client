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
app.use(express.json());

const options = { headers: { apikey: process.env.LPP_API_KEY } };

async function proxyRequest(req, res, next) {
    try {
        const apiRes = await needle('get', `${LPP_API_BASE_URL}${req.url}`, options);
        const data = apiRes.body;
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
}

async function getBusesOnRoutes(req, res) {
    const routes = req.query.routes?.split(',');

    if (!routes) {
        return res.status(400).json({ message: "Missing 'routes' query parameter" });
    }

    const routeUrl = (route) => `${LPP_API_BASE_URL}/api/bus/buses-on-route?route-group-number=${route}&specific=1`;
    const promises = routes.map(
        (route) => fetch(routeUrl(route), options).then((resp) => resp.json()),
    );

    Promise.all(promises).then((results) => {
        const data = results.map((result) => result.data).flat();
        res.send({ data });
    });

    return 500;
}

app.get('/api/station/arrival*', cache('10 seconds'), proxyRequest);
app.get('/api/bus/buses-on-route*', cache('10 seconds'), proxyRequest);
app.get('/api/buses-on-routes', cache('10 seconds'), getBusesOnRoutes);
app.get('/api/route/routes*', cache('1 day'), proxyRequest);
app.get('*', proxyRequest);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Proxy listening on port ${port} ...`));

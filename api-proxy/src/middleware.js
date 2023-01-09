const needle = require('needle');
const dotenv = require('dotenv');

dotenv.config();

const { LPP_API_BASE_URL } = require('./constants');

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

module.exports = {
    proxyRequest,
    getBusesOnRoutes,
};

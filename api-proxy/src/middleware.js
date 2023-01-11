const axios = require('./axios');

async function proxyRequest(req, res, next) {
    try {
        const response = await axios.get(req.url);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error proxying request: ');
        console.error(error.response?.data || error);
        next(error);
    }
}

function getBusesOnRoutes(req, res) {
    const routes = req.query.routes?.split(',');

    if (!routes) {
        return res.status(400).json({ message: "Missing 'routes' query parameter" });
    }

    const promises = routes.map(
        (route) => axios.get(`/api/bus/buses-on-route?route-group-number=${route}&specific=1`),
    );

    Promise.all(promises).then((results) => {
        const data = results.map((result) => result.data.data).flat();
        res.send({ data });
    }).catch((error) => {
        console.error('Error fetching buses: ');
        console.error(error.response?.data || error);
        res.sendStatus(500);
    });
}

module.exports = {
    proxyRequest,
    getBusesOnRoutes,
};

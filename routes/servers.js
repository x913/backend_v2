const express = require('express');
const router = express.Router();
const get_ip = require('ipware')().get_ip;
const User = require('../models/User.model');
const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken  } = require('../helpers/jwt_helper');
const {userValidationSchema} = require('../helpers/validation_schema');
const createError = require('http-errors');
const Server = require('../models/Server.model');
const {    
    cachePerUri, cachePerUser
} = require("../helpers/redis_cache");

router.get('/fastest', verifyAccessToken, cachePerUser, async(req, res, next) => {
    
    try {
        let continent;

        try {
            const ip = get_ip(req);
            const geodata = req.app.get('geo').country(ip.clientIp);
            // const geodata = req.app.get('geo').country('45.77.246.136');
            continent = geodata.continent.names.en
        } catch(error) {
            console.log(error.message);
        }
        const fastestServers = await new Server().getFastest(continent);
        res.status(200).json(fastestServers);    
    } catch(error) {
        next(createError.InternalServerError(error.message));
    }
});


router.get('/', verifyAccessToken, cachePerUri, async(req, res, next) => {
    try {
        const server = new Server();
        const allServers = await server.getAll();
        return res.status(200).json(allServers);  
    } catch(error) {
        next(createError.InternalServerError(error.message));
    }
});

module.exports = router;
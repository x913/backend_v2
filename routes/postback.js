const express = require('express');
const router = express.Router();
const get_ip = require('ipware')().get_ip;
const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken  } = require('../helpers/jwt_helper');
const createError = require('http-errors');
const Postback = require('../models/Postback.model');

router.get('/', verifyAccessToken, async (req, res, next) => {
    try {
        let countryIsoCode;

        try {
            const ip = get_ip(req);
            const geodata = req.app.get('geo').country(ip.clientIp); // ip.clientIp
            countryIsoCode = geodata.country.isoCode;
        } catch (e) {
            console.log('no country by ip, using default country');
        }
 
        const postback = new Postback();
        const postbackValue = await postback.getPostbackByCountryIsoCode(countryIsoCode);
        res.status(200).json(postbackValue);
    } catch (error) {
        next(createError.InternalServerError(error.message));
    }
});

module.exports = router;
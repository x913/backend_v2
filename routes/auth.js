const express = require('express');
const router = express.Router();
const get_ip = require('ipware')().get_ip;
const User = require('../models/User.model');
const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken  } = require('../helpers/jwt_helper');
const {userValidationSchema} = require('../helpers/validation_schema');
const createError = require('http-errors');
const client = require('../helpers/redis_connect');


router.post('/register', async(req, res, next) => {
    const {adv_id, password, sub_referrer} = req.body;

    try {
        const user = new User({ adv_id, password, ip: get_ip(req).clientIp, sub_referrer: sub_referrer });
        const userRegistrationData = await user.register();
        const accessToken = await signAccessToken(userRegistrationData);
        const refreshToken = await signRefreshToken(userRegistrationData);
        res.status(200).json({payload: {accessToken, refreshToken}});
    } catch(error) {
        next(error);
    }
});

router.post('/login', async(req, res, next) => {
    try {
        let userLoginData = {...req.body, ip: get_ip(req).clientIp };
        const user = new User(userLoginData);
        const userId = await user.getUserId();
        if(userId) {
            userLoginData = { adv_id: userLoginData.adv_id, uid: userId };
            const accessToken = await signAccessToken(userLoginData);
            const refreshToken = await signRefreshToken(userLoginData);
            res.status(200).json({payload: {accessToken, refreshToken}});
        }
    } catch(error) {
        next(error);
    }
});

router.post('/refresh-token', async(req, res, next) => {
    try {
        const refreshTokenToVerify = req.body.refreshToken;
        if(!refreshTokenToVerify)
            throw createError.BadRequest('token is not presented');
        
        const userLoginData = await verifyRefreshToken(refreshTokenToVerify);

        // generate access token and refresh token again if verify was success
        const accessToken = await signAccessToken(userLoginData);
        const refreshToken = await signRefreshToken(userLoginData);

        res.status(200).json({payload: {accessToken, refreshToken}});
    } catch(error) {
        //console.log(' -> ', error.message);
        next(error);
    }
});

router.delete('/logout', async(req, res, next) => {
    try {
        const {refreshToken} = req.body;
        if(!refreshToken)
            throw createError.BadRequest();
        const userData = await verifyRefreshToken(refreshToken);
        client.del(`${userData.adv_id}_token`, (err, response) => {
            if(err) {
                console.log(err.message);
                throw createError.InternalServerError();
            }
            console.log(response);
            res.sendStatus(204);
        });
    } catch(error) {
        next(error)
    }
});

module.exports = router;
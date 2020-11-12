const express = require('express');
const router = express.Router();
const get_ip = require('ipware')().get_ip;
const { verifyAccessToken  } = require('../helpers/jwt_helper');
const createError = require('http-errors');
const Referer = require('../models/Referer.model');

router.post('/', verifyAccessToken, async (req, res, next) => {
    try {
        const { referer } = req.body;
        await new Referer(req.payload).update(referer);
        res.sendStatus(200);
    } catch (error) {
        next(createError.InternalServerError(error.message));
    }
});

module.exports = router;
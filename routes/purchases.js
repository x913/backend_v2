const express = require('express');
const router = express.Router();
const get_ip = require('ipware')().get_ip;
const User = require('../models/User.model');
const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken  } = require('../helpers/jwt_helper');
const {userValidationSchema} = require('../helpers/validation_schema');
const createError = require('http-errors');
const Purchase = require('../models/Purchase.model');

router.post('/add', verifyAccessToken, async(req, res, next) => {
    
    try {
        const {adv_id, uid} = req.payload;
        const {token, sku} = req.body;
        const purchase = new Purchase({adv_id, uid})
        await purchase.add({token, sku})
        res.sendStatus(200);
    } catch(error) {
        next(createError.InternalServerError(error.message));
    }
});

module.exports = router;

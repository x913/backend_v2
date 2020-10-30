const JWT = require('jsonwebtoken');
const createError = require('http-errors');
require('dotenv').config();

const client = require('./redis_connect');

module.exports = {
    signAccessToken: (userRegistrationData) => {
        return new Promise((resolve, reject) => {
            const secret = process.env.ACCESS_TOKEN;

            const options = {
                expiresIn: "1h",
                audience: userRegistrationData.adv_id
            };
            JWT.sign(userRegistrationData, secret, options, (err, token) => {
                if(err) {
                    console.log(err);
                    return reject(createError.InternalServerError())
                }
                resolve(token);
            });
        });
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
           JWT.verify(refreshToken, process.env.REFRESH_TOKEN, (err, payload) => {
                if(err)  {
                    return reject(createError.Unauthorized(err));
                }
                const {adv_id, user_key, ip} = payload;
                client.get(`${payload.adv_id}_token`, (err, result) => {
                    if(err) {
                        console.log(err.message);
                        return reject(createError.InternalServerError());
                    }

                    if(refreshToken === result)
                        return resolve({adv_id, user_key, ip});
                    else
                        return reject(createError.Unauthorized());                        
                });
           });
        });
    },
    signRefreshToken: (userRegistrationData) => {
        return new Promise((resolve, reject) => {
            const secret = process.env.REFRESH_TOKEN;
            const options = {
                expiresIn: "1y",
                audience: userRegistrationData.adv_id
            };
            JWT.sign(userRegistrationData, secret, options, (err, token) => {
                if(err) {
                    console.log(err);
                    return reject(createError.InternalServerError());
                }
                // 365 * 24 * 60 * 60 == 1 year
                client.set(`${userRegistrationData.adv_id}_token`, token, 'EX', 365 * 24 * 60 * 60, (err, response) => {
                    if(err) {
                        console.log(err.message);
                        return reject(createError.InternalServerError());
                    }
                    resolve(token);
                });

                
            });
        });
    },
    verifyAccessToken: (req, res, next) => {
        if(!req.headers['authorization']) 
            return next(createError.Unauthorized());
        

        const authHeader = req.headers['authorization'];
        const bearerToken = authHeader.split(' ');
        if(bearerToken.length === 0)
            return next(createError.Unauthorized());
        
        const token = bearerToken[1];
        JWT.verify(token, process.env.ACCESS_TOKEN, (err, payload) => {
            if(err) {
                const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.name;
                return next(createError.Unauthorized(message))
            }
            req.payload = payload;
            next();                
        });
    }
}
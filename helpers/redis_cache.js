const client = require('./redis_connect');

function Cache() {
    
}

Cache.prototype.set = async function(key, data, ttlSec) {
    return await new Promise((resolve, reject) => {
        client.set(key, JSON.stringify(data), 'EX', ttlSec, (err, response) => {
            if(err) {
                reject();
            } else
                resolve();
        });
    });
}

Cache.prototype.get = async function(key) {
    return await new Promise((resolve, reject) => {
        client.get(key, (err, result) => {
            if(err) {
                reject();
            } else {
                resolve(result);
            }      
        });
    });
}

async function cachePerUser(req, res, next) {
    const CACHE_KEY = `${req.originalUrl}_${req.payload.adv_id}`;
    const cachedData = await new Cache().get(CACHE_KEY);
    let old = res.json.bind(res);
    res.json = async (body) => {
        if(!cachedData) {
            await new Cache().set(CACHE_KEY, body, process.env.CACHE_PER_USER_TTL_SEC);
        }
        old(body);  
    };

    if(cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }
    next();
}

async function cachePerUri(req, res, next) {
    const CACHE_KEY = req.originalUrl;
    const cachedData = await new Cache().get(CACHE_KEY);
    let old = res.json.bind(res);
    res.json = async (body) => {
        if(!cachedData) {
            await new Cache().set(CACHE_KEY, body, process.env.CACHE_PER_URI_TTL_SEC);
        }
        old(body);  
    };

    if(cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }
    next();
}

module.exports = {
    cachePerUser,
    cachePerUri
}
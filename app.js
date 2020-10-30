const express = require('express');
const morgan = require('morgan');
const createError = require('http-errors');
const AuthRoute = require('./routes/auth');
const PostbackRoute = require('./routes/postback');
const ServerRoute = require('./routes/servers');
const PurchaseRoute = require('./routes/purchases');
const RefererRoute = require('./routes/referer');
const pool = require('./helpers/mysql_connect');
const responseTime = require('response-time');
const fs = require('fs');

require('dotenv').config();

// init geoip2
const Reader = require('@maxmind/geoip2-node').Reader;
const dbBuffer = fs.readFileSync("GeoLite2-Country.mmdb");
const reader = Reader.openBuffer(dbBuffer);

const PORT = process.env.PORT || 3000;

const app = express();

app.set('pool', pool);
app.set('geo', reader);
app.set('trust proxy', true);
app.use('/static', express.static('static'))
app.use(responseTime());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use(morgan(`:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"`));

app.use(`/${process.env.API_VERSION}/auth`, AuthRoute);
app.use(`/${process.env.API_VERSION}/postback`, PostbackRoute);
app.use(`/${process.env.API_VERSION}/servers`, ServerRoute);
app.use(`/${process.env.API_VERSION}/purchases`, PurchaseRoute);
app.use(`/${process.env.API_VERSION}/referer`, RefererRoute);

app.use(async(req, res, next) => {
    next(createError.NotFound('This route does not exists'));
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    })
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

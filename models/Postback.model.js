const pool = require('../helpers/mysql_connect');
const crypto = require('crypto');
const createError = require('http-errors');

function Postback() { }

Postback.prototype.getPostbackByCountryIsoCode = async function (countryIsoCode) {
    let userCountry = 'UNKNOWN';
    if (countryIsoCode)
        userCountry = countryIsoCode;

    try {
        this.connection = await pool.getConnection();

        let [results] = await this.connection.query(
            `select country, timeout from vpn_postback_interval where country = ? or country = 'UNKNOWN' order by id limit 1`,
            [userCountry]
        );

        return results;

    } catch (error) {
        throw error;
    } finally {
        if (this.connection)
            this.connection.release();
    }
}

module.exports = Postback;
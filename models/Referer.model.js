const pool = require('../helpers/mysql_connect');
const crypto = require('crypto');
const createError = require('http-errors');

function Referer(user) {
    this.user = user;
}

Referer.prototype.update = async function(referer) {
    try {
        if(!referer) 
            throw new createError.BadRequest('referer expected');

        this.connection = await pool.getConnection();
        await this.connection.query('update vpn_users set sub_referrer = ? where id = ?', [referer, this.user.uid]);
    } catch(error) {
        throw error;
    } finally {
        if(this.connection)
            this.connection.release();
    }
}

module.exports = Referer;
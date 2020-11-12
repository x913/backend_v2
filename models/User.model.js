const pool = require('../helpers/mysql_connect');
const crypto = require('crypto');
const createError = require('http-errors');
const {userValidationSchema} = require('../helpers/validation_schema');
require('dotenv').config();


function User(user) {
    this.user = user;
}

User.prototype.validateUserModel = function() {
    const {error} = userValidationSchema.validate(this.user);

    if(error)
        throw createError.UnprocessableEntity(error.details[0].message);

    const expectedPassword = crypto
        .createHmac('sha256', Buffer.from(process.env.SESSION_SECRET, 'utf-8'), {})
        .update(this.user.adv_id)
        .digest('hex');

    const expectedPasswordMD5 = crypto.createHash('md5')
        .update(`${this.user.adv_id}${process.env.SESSION_SECRET}`)
        .digest("hex")
        .toLowerCase();

    if((this.user.password !== expectedPassword) && (this.user.password !== expectedPasswordMD5))
        throw createError.UnprocessableEntity('password doesn`t match');
}

User.prototype.createHmac = function(key, data) {
    return crypto.createHmac('sha256', Buffer.from(key, 'utf-8'), {}).update(data).digest('hex')
}

//  User.prototype.getRegisteredUserKey = async function() {
//     let [results] = await this.connection.query('select * from vpn_users where adv_id = ? limit 1', [this.user.adv_id]);
//     if(results.length !== 0) {
//         const userKey = results[0].user_key;
//         return {
//             uid: results[0].id,
//             adv_id: this.user.adv_id,
//             user_key: this.createHmac(userKey, this.user.adv_id)
//         }
//     }
//  }


 User.prototype.getUserId = async function() {
    try {
        this.validateUserModel();

        if(!this.connection)
            this.connection = await pool.getConnection();
        let [results] = await this.connection.query(`
            select
                vpn_users.id, adv_id, ifnull(p.autoRenewing, 0) as is_premium
            from
                vpn_users
            left join purchases p on
                vpn_users.id = p.user_id
            and
                p.autoRenewing = 1
            where
                adv_id = ?`, [this.user.adv_id]);
    
        if(results.length === 0)
            throw createError.Unauthorized('user not registered');

        await this.connection.query('update vpn_users set last_seen = UNIX_TIMESTAMP()  where id = ?', [results[0].id]);            

        return { uid: results[0].id, is_premium: results[0].is_premium };
    } catch(error) {
        throw error;
    } finally {
        if(this.connection)
            this.connection.release();
    }
 }


 User.prototype.createUser = async function() {
    // const userKey = crypto.randomBytes(16).toString('hex');
    const userKey = process.env.SESSION_SECRET;
    const results = await this.connection.query('insert into vpn_users(adv_id, first_seen, last_ip, sub_referrer, user_key) values(?, UNIX_TIMESTAMP(), ?, ?, ?)', 
    [this.user.adv_id, this.user.ip, this.user.sub_referrer, userKey]);
    return {
        uid: results[0].insertId,
        adv_id: this.user.adv_id,
        //user_key: this.createHmac(userKey, this.user.adv_id)
    }
 }

User.prototype.register = async function() {
    try {
        this.validateUserModel();
        this.connection = await pool.getConnection();

        let [results] = await this.connection.query('select * from vpn_users where adv_id = ? limit 1', [this.user.adv_id]);

        if(results.length !== 0)
            throw createError.Conflict('already registered');
        
        return await this.createUser();
    } catch(error) {
        throw error;
    } finally {
        if(this.connection)
            this.connection.release();
    }
}



module.exports = User;
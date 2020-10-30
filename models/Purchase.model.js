const pool = require('../helpers/mysql_connect');
const crypto = require('crypto');
const Verifier = require('google-play-billing-validator');
const createError = require('http-errors');

// require('dotenv').config();

const options = {
  email: process.env.SERVICE_ACCOUNT_EMAIL,
  key: process.env.SERVICE_ACCOUNT_KEY
}

function Purchase(user) { 
    this.user = user;
}

Purchase.prototype.isPurchaseExists = async function(token) {
    let [result] = await this.connection.query(`select * from purchases where token = ?`, [token]);
    return result.length !== 0;
}

Purchase.prototype.isPurchaseExists = async function(token) {
    let [result] = await this.connection.query(`select * from purchases where token = ?`, [token]);
    return result.length !== 0;
}

Purchase.prototype.updatePurchase = async function(vp, purchaseData) {
   await this.connection.query(`update purchases set 
        startTimeMillis = ?, expiryTimeMillis = ?, autoRenewing = ?, priceAmountMicros = ?,
        countryCode = ?, cancelReason = ?, developerPayload = ?,
        cancelReason = ?, orderId = ?, linkedPurchaseToken = ?, purchaseType = ?, 
        acknowledgementState = ?, 
        kind = ?
    where
        token = ?`, [
            vp.startTimeMillis, vp.expiryTimeMillis, vp.autoRenewing, vp.priceAmountMicros, 
            vp.countryCode, vp.cancelReason, vp.developerPayload, 
            vp.cancelReason, vp.orderId, vp.linkedPurchaseToken, vp.purchaseType, 
            vp.acknowledgementState, vp.kind, purchaseData.token
    ]);
}

//
// vp is an verification payload object
//
Purchase.prototype.createPurchase = async function(vp, purchaseData) {
   await this.connection.query(`insert into 
              purchases(
                user_id, token, sku, 
                startTimeMillis, expiryTimeMillis, autoRenewing, priceCurrencyCode, 
                priceAmountMicros, countryCode, developerPayload,
                cancelReason, orderId, linkedPurchaseToken, purchaseType, acknowledgementState, kind, paymentState
              ) 
            values(?, ?, ?, 
              ?, ?, ?, ?, 
              ?, ?, ?, 
              ?, ?, ?, 
              ?, ?, ?, 
              ?)
   `, [
       this.user.uid, purchaseData.token, purchaseData.sku,
       vp.startTimeMillis, vp.expiryTimeMillis, vp.autoRenewing, vp.priceCurrencyCode, 
       vp.priceAmountMicros, vp.countryCode, vp.developerPayload, 
       vp.cancelReason, vp.orderId, vp.linkedPurchaseToken, 
       vp.purchaseType, vp.acknowledgementState, vp.kind, 
       vp.paymentState
   ]);
}

//
// purchaseData is an object with {token, sku}
//
Purchase.prototype.add = async function (purchaseData) {

    try {
        if (!purchaseData || !purchaseData.token || !purchaseData.sku)
            throw createError.BadRequest();

        let receipt = {
            packageName: process.env.PACKAGE_NAME,
            productId: purchaseData.sku,
            purchaseToken: purchaseData.token
        };

        console.log(receipt);

        const verifier = new Verifier(options);
        await verifier.verifySub(receipt)
        .then(async (resp) => {
            const verificationPayload = resp.payload;
            this.connection = await pool.getConnection();
            if(await this.isPurchaseExists(purchaseData.token)) {
                await this.updatePurchase(verificationPayload, purchaseData);
            } else {
                await this.createPurchase(verificationPayload, purchaseData);
            }
        })
        .catch(err => {
            console.log('>>>>>>>>>>>>>>>>>>> ', err);
            throw createError.BadRequest(err.message);
        });
    } catch (error) {
        throw error;
    } finally {
        if (this.connection)
            this.connection.release();
    }
}

module.exports = Purchase;
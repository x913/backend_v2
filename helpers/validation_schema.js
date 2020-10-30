const Joi = require('@hapi/joi');

const userValidationSchema = Joi.object({
    adv_id: 
        Joi.string()
        .lowercase()
        .pattern(new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'))
        .message('adv_id validation error')
        .required(),

    password: 
        Joi.string()
        .min(8)
        .lowercase()
        .message('password validation error')
        .required()
        .pattern(new RegExp('^[0-9a-f]+$')),

    ip: 
        Joi.string()
        .ip()
        .message('ip address validation error')
        .required(),

    sub_referrer: 
        Joi.string()
        .max(255)
        .message('sub_referrer validation error')
        .optional()


});

module.exports = {
    userValidationSchema
}
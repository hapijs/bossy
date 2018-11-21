'use strict';

// Load modules

const Joi = require('joi');


// Declare internals

const internals = {
    validKeyRegex: /^[a-zA-Z0-9][a-zA-Z0-9-]*$/
};


exports.definition = Joi.object({}).pattern(internals.validKeyRegex, Joi.object({
    alias: Joi.array().items(Joi.string().allow('')).single(),
    type: Joi.string().valid(['boolean', 'range', 'number', 'string', 'object', 'help']).default('string'),
    multiple: Joi.boolean(),
    description: Joi.string(),
    require: Joi.boolean(),
    default: Joi.when('type', { is: 'object', then: Joi.object(), otherwise: Joi.any() }),
    valid: Joi.array().items(Joi.any()).single()
}));

exports.parseOptions = Joi.object({
    argv: Joi.array().items(Joi.string())
});

exports.usageOptions = Joi.object({
    colors: Joi.boolean().allow(null)
});

'use strict';

const Validate = require('@hapi/validate');


const internals = {
    validKeyRegex: /^[a-zA-Z0-9][a-zA-Z0-9-]*$/
};


exports.definition = Validate.object({}).pattern(internals.validKeyRegex, Validate.object({
    alias: Validate.array().items(Validate.string().allow('')).single(),
    type: Validate.string().valid('boolean', 'range', 'number', 'string', 'help').default('string'),
    multiple: Validate.boolean(),
    description: Validate.string(),
    require: Validate.boolean(),
    default: Validate.any(),
    valid: Validate.array().items(Validate.any()).single()
}));


exports.parseOptions = Validate.object({
    argv: Validate.array().items(Validate.string())
});


exports.usageOptions = Validate.object({
    colors: Validate.boolean().allow(null)
});

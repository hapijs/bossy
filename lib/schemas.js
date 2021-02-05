'use strict';

const Validate = require('@hapi/validate');


const internals = {
    validKeyRegex: /^[a-zA-Z0-9][a-zA-Z0-9-\.]*$/
};


exports.definition = Validate.object({}).pattern(internals.validKeyRegex, Validate.object({
    alias: Validate.array().items(Validate.string().allow('')).single(),
    type: Validate.string().valid('json', 'boolean', 'range', 'number', 'string', 'help').default('string'),
    multiple: Validate.boolean()
        .when('type', { is: 'json', then: Validate.forbidden() }),
    description: Validate.string(),
    require: Validate.boolean(),
    default: Validate.any()
        .when('type', { is: 'json', then: [Validate.array(), Validate.object()] }),
    valid: Validate.array().items(Validate.any()).single()
        .when('type', { is: 'json', then: Validate.forbidden() }),
    parsePrimitives: Validate.boolean().allow('strict')
        .when('type', { is: 'json', otherwise: Validate.forbidden() })
}), { fallthrough: true })
    .pattern(/\./, Validate.object({ type: Validate.invalid('json') }));


exports.parseOptions = Validate.object({
    argv: Validate.array().items(Validate.string())
});


exports.usageOptions = Validate.object({
    colors: Validate.boolean().allow(null)
});

// Load modules

var Hoek = require('hoek');


// Declare internals

var internals = {};


exports.parse = function (definition, options) {

    var flags = {};
    var keys = {};

    var names = Object.keys(definition);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        var def = Hoek.clone(definition[name]);
        def.name = name;
        keys[name] = def;
        if (def.alias) {
            var aliases = [].concat(def.alias);
            for (var a = 0, al = aliases.length; a < al; ++a) {
                keys[aliases[a]] = def;
            }
        }

        if (def.type === 'boolean') {
            flags[name] = false;
        }
    }

    // -a -ab --aa -c 1 -d x -d y -e 1-4 -f arg1 arg2 arg3

    var last = null;
    var args = process.argv.slice(2);
    for (i = 0, il = args.length; i < il; ++i) {
        var arg = args[i];
        if (arg[0] === '-') {

            // Key

            var char = arg[1];
            internals.assert(char, 'Invalid empty \'-\' option');
            internals.assert(char !== '-' || arg.length > 2, 'Invalid empty \'--\' option');

            var opts = (char === '-' ? [arg.slice(2)] : arg.slice(1).split(''));
            for (var p = 0, pl = opts.length; p < pl; ++p) {
                internals.assert(!last, 'Invalid option:', last && last.name, 'missing value');

                var opt = opts[p];
                var def = keys[opt];
                internals.assert(def, 'Unknown option:', opt);
                if (def.type === 'boolean') {
                    flags[def.name] = true;
                }
                else {
                    last = def;
                }
            }
        }
        else {

            // Value

            var value = arg;
            if (last &&
                last.type) {

                if (last.type === 'number') {
                    value = parseInt(arg, 10);
                    internals.assert(Hoek.isInteger(value), 'Invalid value (non-number) for option:', last.name);
                }
            }

            var name = last ? last.name : '_';
            if (flags[name]) {
                flags[name] = [].concat(flags[name], value);
            }
            else {
                flags[name] = value;
            }

            last = null;
        }
    }

    for (i = 0, il = names.length; i < il; ++i) {
        var def = keys[names[i]];
        if (def.type === 'range') {
            internals.parseRange(def, flags);
        }

        if (flags[def.name] === undefined) {
            flags[def.name] = def.default;
        }

        internals.assert(!def.require || flags[def.name] !== undefined, def);
    }


    return flags;
};


exports.usage = function (definition) {

    var output = '';
    var names = Object.keys(definition);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        var def = definition[name];
        var type = def.type || 'string';

        output += '-';
        if (def.alias && def.alias.length < name.length) {
            output += '--';
        }

        output += name + ' [' + type.toUpperCase() + ']';
        output += def.required ? ' (required)\n' : '\n';
        output += def.description ? def.description + '\n\n' : '\n';
    }

    return output;
};


internals.parseRange = function (def, flags) {

    var value = flags[def.name];
    if (!value) {
        return;
    }

    var values = [];
    var nums = [].concat(value).join(',');
    var ranges = nums.match(/(?:\d+\-\d+)|(?:\d+)/g);
    for (var n = 0, nl = ranges.length; n < nl; ++n) {
        var range = ranges[n];

        range = range.split('-');
        var from = parseInt(range[0], 10);
        if (range.length === 2) {
            var to = parseInt(range[1], 10);
            if (from > to) {
                continue;
            }

            for (var r = from; r <= to; ++r) {
                values.push(r);
            }
        }
        else {
            values.push(from);
        }
    }

    flags[def.name] = values;
};


internals.assert = function (condition, definition) {

    if (condition) {
        return;
    }

    var usage = exports.usage(definition);
    throw new Error(usage);
};

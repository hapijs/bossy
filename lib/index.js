// Load modules

var Tty = require('tty');
var Hoek = require('hoek');


// Declare internals

var internals = {};


exports.parse = function (definition, options) {

    var flags = {};
    var keys = {};
    options = options || {};

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

        if (def.valid !== undefined && !Array.isArray(def.valid)) {
            def.valid = [def.valid];
        }

        if (def.type === 'boolean' && def.default !== undefined) {
            flags[name] = def.default;
        }
        else if (def.type === 'boolean') {
            flags[name] = false;
        }
    }

    var args = options.argv || process.argv.slice(2);
    var last = null;
    var errors = [];
    var help = false;

    for (i = 0, il = args.length; i < il; ++i) {
        var arg = args[i];
        if (arg[0] === '-') {

            // Key

            var char = arg[1];
            if (!char) {
                errors.push(internals.formatError('Invalid empty \'-\' option'));
                continue;
            }

            if (char === '-' && arg.length <= 2) {
                errors.push(internals.formatError('Invalid empty \'--\' option'));
                continue;
            }

            var opts = (char === '-' ? [arg.slice(2)] : arg.slice(1).split(''));
            for (var p = 0, pl = opts.length; p < pl; ++p) {

                if (last) {
                    errors.push(internals.formatError('Invalid option:', last.name, 'missing value'));
                    continue;
                }

                var opt = opts[p];
                def = keys[opt];
                if (!def) {
                    errors.push(internals.formatError('Unknown option:', opt));
                    continue;
                }

                if (def.type === 'help') {
                    flags[def.name] = true;
                    help = true;
                }
                else if (def.type === 'boolean') {
                    flags[def.name] = true;
                }
                else if (def.type === 'number' && pl > 1) {
                    args.splice(i + 1, 0, arg.split(char)[1]);
                    ++il;
                    last = def;
                    break;
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

                    if (!Hoek.isInteger(value)) {
                        errors.push(internals.formatError('Invalid value (non-number) for option:', last.name));
                        continue;
                    }
                }
            }

            if (last &&
                last.valid &&
                last.valid.indexOf(value) === -1) {

                errors.push(internals.formatError('Invalid value for option:', last.name));
                continue;
            }

            name = last ? last.name : '_';
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
        def = keys[names[i]];
        if (def.type === 'range') {
            internals.parseRange(def, flags);
        }

        if (flags[def.name] === undefined) {
            flags[def.name] = def.default;
        }

        if (def.require && flags[def.name] === undefined) {
            errors.push(internals.formatError(definition));
        }

        if (def.alias) {
            aliases = [].concat(def.alias);
            for (var d = 0, dl = aliases.length; d < dl; ++d) {
                var alias = aliases[d];
                flags[alias] = flags[def.name];
            }
        }
    }

    if (errors.length && !help) { return errors[0]; }

    return flags;
};


exports.usage = function (definition, usage, options) {

    if ((arguments.length === 2) && (typeof usage === 'object')) {
        options = usage;
        usage = '';
    }

    options = options || { colors: null };
    var color = internals.colors(options.colors);
    var output = usage ? 'Usage: ' + usage + '\n\n' : '\n';
    var col1 = ['Options:'];
    var col2 = ['\n'];

    var names = Object.keys(definition);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        var def = definition[name];

        var shortName = internals.getShortName(name, def.alias);
        var longName = (shortName === name) ? def.alias : name;

        var formattedName = '  -' + shortName;
        if (longName) {
            var aliases = [].concat(longName);
            for (var a = 0, al = aliases.length; a < al; ++a) {
                formattedName += ', --' + aliases[a];
            }
        }

        var formattedDesc = def.description ? color.gray(def.description) : '';
        if (def.require) {
            formattedDesc += formattedDesc.length ? ' ' : '';
            formattedDesc += color.yellow('(required)');
        }

        col1.push(color.green(formattedName));
        col2.push(formattedDesc);
    }

    return output + internals.formatColumns(col1, col2);
};


internals.formatError = function (definition) {

    var msg = '';
    if (arguments.length > 1) {
        msg = Array.prototype.slice.call(arguments, 0).join(' ');
    }
    else if (typeof definition === 'string') {
        msg = definition;
    }
    else {
        msg = exports.usage(definition);
    }

    return new Error(msg);
};


internals.getShortName = function (shortName, alias) {

    if (!alias) {
        return shortName;
    }

    var aliases = [].concat(alias);
    for (var i = 0, il = aliases.length; i < il; ++i) {
        if (aliases[i] && aliases[i].length < shortName.length) {
            shortName = aliases[i];
        }
    }

    return shortName;
};


internals.formatColumns = function (col1, col2) {

    var rows = [];
    var col1Width = 0;
    col1.forEach(function (text) {

        if (text.length > col1Width) {
            col1Width = text.length;
        }
    });

    for (var i = 0, il = col1.length; i < il; ++i) {
        var row = col1[i];
        var padding = new Array((col1Width - row.length) + 5).join(' ');

        row += padding + col2[i];
        rows.push(row);
    }

    return rows.join('\n');
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
                for (var r = from; r >= to; --r) {
                    values.push(r);
                }
            }
            else {
                for (r = from; r <= to; ++r) {
                    values.push(r);
                }
            }
        }
        else {
            values.push(from);
        }
    }

    flags[def.name] = values;
};


internals.colors = function (enabled) {

    if (enabled === null) {
        enabled = Tty.isatty(1) && Tty.isatty(2);
    }

    var codes = {
        'black': 0,
        'gray': 90,
        'red': 31,
        'green': 32,
        'yellow': 33,
        'magenta': 35,
        'redBg': 41,
        'greenBg': 42
    };

    var colors = {};
    var names = Object.keys(codes);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        colors[name] = internals.color(name, codes[name], enabled);
    }

    return colors;
};


internals.color = function (name, code, enabled) {

    if (enabled) {
        var color = '\u001b[' + code + 'm';
        return function (text) { return color + text + '\u001b[0m'; };
    }

    return function (text) { return text; };
};

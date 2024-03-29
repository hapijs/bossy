'use strict';

const Tty = require('tty');

const Bossy = require('../');
const Hoek = require('@hapi/hoek');
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('parse()', () => {

    const parse = function (line, definition, options) {

        const orig = process.argv;
        process.argv = [].concat('ignore', 'ignore', Array.isArray(line) ? line : line.split(' '));
        const result = Bossy.parse(definition, options);
        process.argv = orig;
        return result;
    };

    it('parses command line', () => {

        const line = '-a -cb --aa -C 1 -C42 -d x -d 2 -e 1-4,6-7 --i.x 2 --i.y.z one -f arg1 arg2 arg3';
        const definition = {
            a: {
                type: 'boolean'
            },
            A: {
                alias: 'aa',
                type: 'boolean'
            },
            b: {
                type: 'boolean'
            },
            c: {
                type: 'boolean',
                require: true
            },
            C: {
                type: 'number',
                multiple: true
            },
            d: {
                type: 'string',
                multiple: true
            },
            e: {
                type: 'range'
            },
            f: {

            },
            g: {
                type: 'boolean'
            },
            h: {
                type: 'string',
                default: 'hello',
                alias: 'H'
            },
            i: {
                type: 'json',
                default: { x: 1, w: 3 }
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.not.be.instanceof(Error);
        expect(argv).to.equal({ a: true,
            A: true,
            b: true,
            c: true,
            g: false,
            C: [1, 42],
            d: ['x', '2'],
            e: [1, 2, 3, 4, 6, 7],
            f: 'arg1',
            _: ['arg2', 'arg3'],
            aa: true,
            h: 'hello',
            H: 'hello',
            i: { x: '2', y: { z: 'one' }, w: 3 }
        });
    });

    it('copies values into all of a key\'s aliases', () => {

        const line = '--path ./usr/home/bin -c -T 1-4,6-7 --time 9000';
        const definition = {
            p: {
                alias: ['path', 'Path', '$PATH']
            },
            c: {
                alias: 'command',
                type: 'boolean'
            },
            C: {
                type: 'number',
                alias: ['change', 'time']
            },
            t: {
                type: 'range',
                alias: ['T', 'tes']
            },
            h: {
                type: 'string',
                default: 'hello',
                alias: 'H'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.not.be.instanceof(Error);
        expect(argv).to.equal({
            c: true,
            p: './usr/home/bin',
            t: [1, 2, 3, 4, 6, 7],
            path: './usr/home/bin',
            Path: './usr/home/bin',
            '$PATH': './usr/home/bin',
            C: 9000,
            change: 9000,
            command: true,
            time: 9000,
            T: [1, 2, 3, 4, 6, 7],
            tes: [1, 2, 3, 4, 6, 7],
            h: 'hello',
            H: 'hello'
        });
    });

    it('does not return message when required parameter is missing if type help is being executed', () => {

        const line = '--try -q -h';
        const definition = {
            h: {
                type: 'help'
            },
            b: {
                type: 'number',
                require: true
            }
        };

        const argv = parse(line, definition);
        expect(argv.h).to.equal(true);
    });

    it('returns error message when required parameter is missing', () => {

        const line = '-a';
        const definition = {
            a: {
                type: 'boolean'
            },
            b: {
                type: 'number',
                require: true
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
    });

    it('returns list of valid options for multple options', () => {

        const line = '-a rezero';
        const definition = {
            a: {
                type: 'string',
                valid: ['steins;gate','erased','death note']
            }
        };

        const argv = parse(line, definition);
        expect(argv.message).to.include('steins;gate');
        expect(argv.message).to.include('erased');
        expect(argv.message).to.include('death note');
        expect(argv).to.be.instanceof(Error);
    });

    it('returns error message when an unknown argument is used', () => {

        const line = '-ac';
        const definition = {
            a: {
                type: 'boolean'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
    });

    it('returns error message when an empty - is passed', () => {

        const line = '-';
        const definition = {
            a: {
                type: 'boolean'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
    });

    it('returns error message when an empty -- is passed', () => {

        const line = '--';
        const definition = {
            a: {
                type: 'boolean'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
    });

    it('returns error message when an empty value is passed', () => {

        const line = '-b -a';
        const definition = {
            a: {
                type: 'string'
            },
            b: {
                type: 'string'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
    });

    it('returns error message when a non-number value is passed for a number argument', () => {

        const line = '-a hi';
        const definition = {
            a: {
                type: 'number'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
    });

    it('returns undefined when an empty value is passed for a range', () => {

        const line = '-a';
        const definition = {
            a: {
                type: 'range'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ a: undefined });
    });

    it('is able to parse a range plus an additional number', () => {

        const line = '-a 1-2,5';
        const definition = {
            a: {
                type: 'range'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ a: [1, 2, 5] });
    });

    it('is able to parse a range in reverse order', () => {

        const line = '-a 5-1';
        const definition = {
            a: {
                type: 'range'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ a: [5, 4, 3, 2, 1] });
    });

    it('allows a boolean to be defaulted to null', () => {

        const line = '';
        const definition = {
            a: {
                type: 'boolean',
                default: null
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ a: null, _: [''] });
    });

    it('allows a boolean to be negated', () => {

        const line = '--no-a';
        const definition = {
            a: {
                type: 'boolean',
                default: true
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ a: false });
    });

    it('allows a boolean that has already been passed to be negated and vice-versa', () => {

        const definition = {
            a: {
                type: 'boolean'
            }
        };

        const argv1 = parse('-a --no-a', definition);
        expect(argv1).to.equal({ a: false });

        const argv2 = parse('--no-a -a', definition);
        expect(argv2).to.equal({ a: true });
    });

    it('doesn\'t assume "no-" to denote boolean negation', () => {

        const line = '--no-a';
        const definition = {
            'no-a': {
                type: 'boolean'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ 'no-a': true });
    });

    it('only negates booleans', () => {

        const line = '--no-a';
        const definition = {
            a: {
                type: 'string'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
        expect(argv.message).to.contain('Unknown option: no-a');
    });

    it('prefers explicit argument to boolean negation in a conflict', () => {

        const line = '--no-a str';
        const definition = {
            a: {
                type: 'boolean',
                default: true
            },
            'no-a': {
                type: 'string'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ a: true, 'no-a': 'str' });
    });

    it('allows json to build an object, parsing primitives.', () => {

        const line = [
            '--x', '{ "a": null, "b": { "c": 2 } }',
            '--x.b.d', '3',
            '--x.e', '["four"]',
            '--x.f', 'false',
            '--x.g', 'null'
        ];
        const definition = {
            x: {
                type: 'json',
                parsePrimitives: true
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({
            x: {
                a: null,
                b: { c: 2, d: 3 },
                e: ['four'],
                f: false,
                g: null
            }
        });
    });

    it('allows json to build an object, parsing primitives strictly.', () => {

        const line = [
            '--x.a.b', '3',
            '--x.a.c', '4.2e2',
            '--x.d', 'false',
            '--x.e', 'true',
            '--x.f', 'null',
            '--x.g', '"str"',
            '--x.a.c', '4.2'
        ];
        const definition = {
            x: {
                type: 'json',
                parsePrimitives: 'strict'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({
            x: {
                a: { b: 3, c: 4.2 },
                d: false,
                e: true,
                f: null,
                g: 'str'
            }
        });
    });

    it('does not allow json arg to contain invalid JSON, parsing primitives strictly.', () => {

        const definition = {
            x: {
                type: 'json',
                parsePrimitives: 'strict'
            }
        };

        const line1 = ['--x.a', 'str'];
        const argv1 = parse(line1, definition);
        expect(argv1).to.be.instanceof(Error);
        expect(argv1.message).to.equal('Invalid value for option: x.a (invalid JSON)');

        const line2 = ['--x.a', '{ "b": null'];
        const argv2 = parse(line2, definition);
        expect(argv2).to.be.instanceof(Error);
        expect(argv2.message).to.equal('Invalid value for option: x.a (invalid JSON)');
    });

    it('does not allow json arg to contain an array or object, parsing primitives strictly.', () => {

        const definition = {
            x: {
                type: 'json',
                parsePrimitives: 'strict'
            }
        };

        const line1 = ['--x.a', '[1, 2]'];
        const argv1 = parse(line1, definition);
        expect(argv1).to.be.instanceof(Error);
        expect(argv1.message).to.equal('Invalid value for option: x.a (non-primitive JSON value)');

        const line2 = ['--x.a', '{ "b": null }'];
        const argv2 = parse(line2, definition);
        expect(argv2).to.be.instanceof(Error);
        expect(argv2.message).to.equal('Invalid value for option: x.a (non-primitive JSON value)');
    });

    it('allows json to build an object, not parsing primitives.', () => {

        const line = ['--x', '{ "a": null, "b": { "c": 2 } }', '--x.b.d', '3', '--x.e', '["four"]', '--x.f', 'false', '--x.g', 'null'];
        const definition = {
            x: {
                type: 'json',
                parsePrimitives: false
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ x: { a: null, b: { c: 2, d: '3' }, e: ['four'], f: 'false', g: 'null' } });
    });

    it('allows json to build an object, by default not parsing primitives.', () => {

        const line = '--x.a null --x.b 2 --x.c true --x.d false --x.e str';
        const definition = {
            x: {
                type: 'json'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ x: { a: 'null', b: '2', c: 'true', d: 'false', e: 'str' } });
    });

    it('merges into json object defaults', () => {

        const line = ['--x.b', 'two', '--x', '{ "c": 3 }'];
        const definition = {
            x: {
                type: 'json',
                default: { a: 1, b: 4 }
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ x: { a: 1, b: 'two', c: 3 } });
        expect(definition.x.default).to.equal({ a: 1, b: 4 }); // No mutation of defaults despite merge
    });

    it('only sets json arg types deeply', () => {

        const line = '--a.b str';
        const definition = {
            a: {
                type: 'string'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
        expect(argv.message).to.contain('Unknown option: a.b');
    });

    it('requires json args be objects', () => {

        const definition = {
            a: {
                type: 'json',
                parsePrimitives: true
            }
        };

        const line1 = '--a str';
        const argv1 = parse(line1, definition);
        expect(argv1).to.be.instanceof(Error);
        expect(argv1.message).to.contain('Invalid value for option: a (must be an object or array)');

        const line2 = '--a null';
        const argv2 = parse(line2, definition);
        expect(argv2).to.be.instanceof(Error);
        expect(argv2.message).to.contain('Invalid value for option: a (must be an object or array)');
    });

    it('handles missing arg for json-looking option', () => {

        const line = '--y.z str';
        const definition = {
            x: {
                type: 'json'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
        expect(argv.message).to.contain('Unknown option: y.z');
    });

    it('requires json arg default be an array or object', () => {

        const definition = (def) => ({
            x: {
                type: 'json',
                default: def
            }
        });

        expect(() => parse('', definition([]))).to.not.throw();
        expect(() => parse('', definition({}))).to.not.throw();
        expect(() => parse('', definition('str'))).to.throw(/must be one of \[array, object\]/);
        expect(() => parse('', definition(null))).to.throw(/must be one of \[array, object\]/);
        expect(() => parse('', definition(100))).to.throw(/must be one of \[array, object\]/);
    });

    it('does not allow passing valid option for json args', () => {

        const definition = {
            x: {
                type: 'json',
                valid: { x: 1 }
            }
        };

        expect(() => parse('', definition)).to.throw(/"x\.valid" is not allowed/);
    });

    it('does not allow passing multiple option for json args', () => {

        const definition = {
            x: {
                type: 'json',
                multiple: true
            }
        };

        expect(() => parse('', definition)).to.throw(/"x\.multiple" is not allowed/);
    });

    it('does not allow passing parsePrimitives option for non-json args', () => {

        const definition = {
            x: {
                type: 'string',
                parsePrimitives: false
            }
        };

        expect(() => parse('', definition)).to.throw(/"x\.parsePrimitives" is not allowed/);
    });

    it('does not allow json args to have a deep flag name', () => {

        const definition = {
            'x.y': {
                type: 'json'
            }
        };

        expect(() => parse('', definition)).to.throw(/"x\.y\.type" contains an invalid value/);
    });

    it('protects from prototype poisoning when parsing JSON for json args', () => {

        const line = ['--x', '{ "y": 1, "__proto__": { "z": 2 } }'];
        const definition = {
            x: {
                type: 'json'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ x: { y: 1 } });
    });

    it('protects from prototype poisoning in dot-separated json path', () => {

        const line = '--x.__proto__.y one --x.z two --x.__proto__.w three';
        const definition = {
            x: {
                type: 'json'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ x: { z: 'two' } });
    });

    it('allows custom argv to be passed in options in place of process.argv', () => {

        let argv = ['-a', '1-2,5'];
        const definition = {
            a: {
                type: 'range'
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.equal({ a: [1, 2, 5] });
    });

    it('returns error message when multiple number values are passed in by default', () => {

        let argv = ['-a', '0', '-a', '1'];
        const definition = {
            a: {
                type: 'number'
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.be.instanceof(Error);
    });

    it('returns error message when multiple string values are passed in by default', () => {

        let argv = ['-a', 'x', '-a', 'y'];
        const definition = {
            a: {
                type: 'string'
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.be.instanceof(Error);
    });

    it('returns error message when multiple range values are passed in by default', () => {

        let argv = ['-a', '0,1-2,5', '-a', '8-9'];
        const definition = {
            a: {
                type: 'range'
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.be.instanceof(Error);
    });

    it('always returns an array when multiple number option is set to true', () => {

        let argv = ['-a', '0'];
        const definition = {
            a: {
                type: 'number',
                multiple: true
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.equal({ a: [0] });
    });

    it('always returns an array when multiple string option is set to true', () => {

        let argv = ['-a', 'x'];
        const definition = {
            a: {
                type: 'string',
                multiple: true
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.equal({ a: ['x'] });
    });

    it('always returns an array when multiple range option is set to true', () => {

        let argv = ['-a', '1'];
        const definition = {
            a: {
                type: 'range',
                multiple: true
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.equal({ a: [1] });
    });

    it('allows multiple number values to be passed in', () => {

        let argv = ['-a', '0', '-a', '1'];
        const definition = {
            a: {
                type: 'number',
                multiple: true
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.equal({ a: [0, 1] });
    });

    it('allows multiple string values to be passed in', () => {

        let argv = ['-a', 'x', '-a', 'y'];
        const definition = {
            a: {
                type: 'string',
                multiple: true
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.equal({ a: ['x', 'y'] });
    });

    it('allows multiple range values to be passed in', () => {

        let argv = ['-a', '0,1-2,5', '-a', '8-9'];
        const definition = {
            a: {
                type: 'range',
                multiple: true
            }
        };

        argv = Bossy.parse(definition, { argv });
        expect(argv).to.equal({ a: [0, 1, 2, 5, 8, 9] });
    });

    it('allows non-json args to have a deep flag name', () => {

        const line = '--a.x --b.x 1 --c.x str --d.x 1-2';
        const definition = {
            'a.x': {
                type: 'boolean'
            },
            'b.x': {
                type: 'number'
            },
            'c.x': {
                type: 'string'
            },
            'd.x': {
                type: 'range'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ 'a.x': true, 'b.x': 1, 'c.x': 'str', 'd.x': [1, 2] });
    });

    it('prefers non-json arg with deep flag name to json arg with the same base', () => {

        const line = '--a.x 1';
        const definition = {
            a: {
                type: 'json'
            },
            'a.x': {
                type: 'number'
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ a: undefined, 'a.x': 1 });
    });

    it('returns error message when a value isn\'t found in the valid property', () => {

        const line = '-a 2';
        const definition = {
            a: {
                type: 'number',
                valid: 1
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
    });

    it('returns error message when a value isn\'t found in array of valid values', () => {

        const line = '-a 4';
        const definition = {
            a: {
                type: 'number',
                valid: [1, 2, 3]
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);
    });

    it('doesn\'t return an error when the value is in the valid array', () => {

        const line = '-a 2';
        const definition = {
            a: {
                type: 'number',
                valid: [1, 2, 3]
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ a: 2 });
    });

    it('doesn\'t return an error when the value is in equal to the valid value', () => {

        const line = '-a 0';
        const definition = {
            a: {
                type: 'number',
                valid: 0
            }
        };

        const argv = parse(line, definition);
        expect(argv).to.equal({ a: 0 });
    });

    it('displays unrecognized arguments in error message ', () => {

        const line = '-a 0 -b';
        const definition = {
            a: {
                type: 'number',
                description: 'This needs a number'
            }
        };

        const argv = parse(line, definition);
        expect(argv.message).to.contain('Unknown option: b');
    });

    it('throws on invalid input ', () => {

        const line = '-a 0 -b';

        expect(() => {

            const definition = {
                a: {
                    unknown: true
                }
            };

            parse(line, definition);
        }).to.throw(Error, /^Invalid definition/);

        expect(() => {

            const definition = {
                a: {
                    type: 'unknown'
                }
            };

            parse(line, definition);
        }).to.throw(Error, /^Invalid definition/);

        expect(() => {

            const definition = {
                '!!': {}
            };

            parse(line, definition);
        }).to.throw(Error, /^Invalid definition/);

        expect(() => {

            parse(line, {}, { args: ['-c'] });
        }).to.throw(Error, /^Invalid options argument/);
    });
});

describe('usage()', () => {

    it('returns formatted usage information', () => {

        const definition = {
            a: {
                type: 'number',
                description: 'This needs a number'
            },
            b: {
                alias: 'beta',
                require: true,
                description: 'Description for b'
            },
            c: {
                require: true
            },
            longname: {
                type: 'string'
            }
        };

        const result = Bossy.usage(definition);
        expect(result).to.contain('-a');
        expect(result).to.contain('This needs a number');
        expect(result).to.contain('-b, --beta');
        expect(result).to.contain('--longname');
    });

    it('returns formatted usage header when provided', () => {

        const definition = {
            h: {
                type: 'string',
                description: 'Show help'
            }
        };

        const result = Bossy.usage(definition, 'bossy -h');
        expect(result).to.contain('Usage: bossy -h');
        expect(result).to.contain('-h');
        expect(result).to.contain('Show help');
    });

    it('returns formatted usage information with colors when enabled', () => {

        const definition = {
            a: {
                alias: 'alpha',
                require: true,
                description: 'Description for b'
            }
        };

        const result = Bossy.usage(definition, { colors: true });

        expect(result).to.contain('-a');
        expect(result).to.contain('\u001b[0m');
    });

    it('when colors are missing defaults to true if tty supports colors', () => {

        const definition = {
            a: {
                alias: 'alpha',
                require: true,
                description: 'Description for b'
            }
        };

        const currentIsAtty = Tty.isatty;

        let count = 0;
        Tty.isatty = () => {

            if (++count === 2) {
                Tty.isatty = currentIsAtty;
            }

            return true;
        };

        const result = Bossy.usage(definition);

        expect(result).to.contain('-a');
        expect(result).to.contain('\u001b[0m');
    });

    it('when colors are missing defaults to false if tty doesn\'t support colors', () => {

        const definition = {
            a: {
                alias: 'alpha',
                require: true,
                description: 'Description for b'
            }
        };

        const currentIsAtty = Tty.isatty;

        Tty.isatty = () => {

            Tty.isatty = currentIsAtty;
            return false;
        };

        const result = Bossy.usage(definition);

        expect(result).to.contain('-a');
        expect(result).to.not.contain('\u001b[0m');
    });

    it('returns colors usage information when passed as parameter', () => {

        const definition = {
            a: {
                alias: 'alpha',
                require: true,
                description: 'Description for b'
            }
        };

        const result = Bossy.usage(definition, 'bossy -c', { colors: true });

        expect(result).to.contain('bossy');
        expect(result).to.contain('-a');
        expect(result).to.contain('\u001b[0m');
    });

    it('formatted usage message orders as -s,--long in first column', () => {

        const definition = {
            a: {
                type: 'number',
                description: 'This needs a number'
            },
            b: {
                alias: 'beta',
                description: 'Description for b'
            },
            code: {
                alias: 'c'
            },
            d: {
                alias: ['']
            }
        };

        const result = Bossy.usage(definition);
        expect(result).to.contain('-a');
        expect(result).to.contain('-b, --beta');
        expect(result).to.contain('-c, --code');
    });

    it('formatted usage message orders shows default values', () => {

        const definition = {
            aa: {
                type: 'number',
                description: 'This needs a number'
            },
            b: {
                alias: 'beta',
                description: 'Description for b',
                default: 'b'
            },
            code: {
                alias: 'c',
                default: 'c'
            },
            d: {
                alias: ['']
            },
            e: {
                type: 'number',
                default: 0
            },
            f: {
                type: 'json',
                default: { x: 'y', z: 1 }
            }
        };

        const result = Bossy.usage(definition);
        expect(result).to.contain('-a');
        expect(result).to.contain('-b, --beta');
        expect(result).to.contain('(b)');
        expect(result).to.contain('-c, --code');
        expect(result).to.contain('(c)');
        expect(result).to.contain('-e');
        expect(result).to.contain('(0)');
        expect(result).to.contain('-f');
        expect(result).to.contain('({"x":"y","z":1})');
    });
});

describe('object()', () => {

    const parse = function (line, definition) {

        return Bossy.parse(definition, {
            argv: [].concat('ignore', 'ignore', Array.isArray(line) ? line : line.split(' '))
        });
    };

    it('rolls-up parsed arguments with deep paths into an object', () => {

        const line = ['--x.a', '--x.b.c', '1', '--x.d.e', 'str', '--x.d.f', '1-2', '--x', '{ "b": { "c": "10" }, "d": { "g": "h" } }'];
        const definition = {
            x: {
                type: 'json'
            },
            'x.a': {
                type: 'boolean'
            },
            'x.b.c': {
                type: 'number'
            },
            'x.d.e': {
                type: 'string'
            },
            'x.d.f': {
                type: 'range'
            }
        };

        const argv = parse(line, definition);
        const snapshot = Hoek.clone(argv);

        expect(argv).to.equal({
            'x.a': true,
            'x.b.c': 1,
            'x.d.e': 'str',
            'x.d.f': [
                1,
                2
            ],
            x: {
                b: {
                    c: '10'
                },
                d: {
                    g: 'h'
                }
            },
            _: [
                'ignore',
                'ignore'
            ]
        });

        expect(Bossy.object('x', argv)).to.equal({
            a: true,
            b: {
                c: 1
            },
            d: {
                e: 'str',
                f: [
                    1,
                    2
                ],
                g: 'h'
            }
        });

        expect(argv).to.equal(snapshot); // No mutation despite merge
    });

    it('merges values shallow to deep', () => {

        const x = Bossy.object('x', {
            'x.a.b.c': 1,
            'x.d.e': 'two',
            'x.f': true,
            x: {
                a: {
                    b: {
                        c: 2,
                        g: 'two'
                    }
                },
                d: { e: 'three', h: 3 },
                f: false,
                i: null
            }
        });

        expect(x).to.equal({
            a: {
                b: {
                    c: 1,
                    g: 'two'
                }
            },
            d: { e: 'two', h: 3 },
            f: true,
            i: null
        });
    });

    it('defaults initial value to an empty object', () => {

        expect(Bossy.object('x', {})).to.equal({});
        expect(Bossy.object('x', { 'x.a': 1 })).to.equal({ a: 1 });
    });

    it('does not allow rolling-up a deep flag', () => {

        expect(() => Bossy.object('x.y', { 'x.y': {} })).to.throw('Cannot build an object at a deep path: x.y (contains a dot)');
    });
});

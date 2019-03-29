'use strict';

const Tty = require('tty');

const Bossy = require('../');
const Code = require('code');
const Lab = require('lab');


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('parse()', () => {

    const parse = function (line, definition, options) {

        const orig = process.argv;
        process.argv = [].concat('ignore', 'ignore', line.split(' '));
        const result = Bossy.parse(definition, options);
        process.argv = orig;
        return result;
    };

    it('parses command line', () => {

        const line = '-a -cb --aa -C 1 -C42 -d x -d 2 -e 1-4,6-7 -f arg1 arg2 arg3';
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
            H: 'hello'
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
            }

        };

        const result = Bossy.usage(definition);
        expect(result).to.contain('-a');
        expect(result).to.contain('-b, --beta');
        expect(result).to.contain('(b)');
        expect(result).to.contain('-c, --code');
        expect(result).to.contain('(c)');
    });
});

// Load modules

var Lab = require('lab');
var Bossy = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.experiment;
var it = lab.test;
var expect = Lab.expect;


describe('Bossy', function () {

    describe('#parse', function () {

        var parse = function (line, definition, options) {

            var orig = process.argv;
            process.argv = [].concat('ignore', 'ignore', line.split(' '));
            var result = null;
            try {
                result = Bossy.parse(definition, options);
            }
            catch (err) {
                result = err;
            }
            process.argv = orig;
            return result;
        };

        it('parses command line', function (done) {

            var line = '-a -cb --aa -C 1 -d x -d 2 -e 1-4,6-7 -f arg1 arg2 arg3';
            var definition = {
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
                    type: 'number'
                },
                d: {
                    type: 'string'
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

            var argv = parse(line, definition);
            expect(argv).to.not.be.instanceof(Error);
            expect(argv).to.deep.equal({ a: true,
                A: true,
                b: true,
                c: true,
                g: false,
                C: 1,
                d: [ 'x', '2' ],
                e: [1, 2, 3, 4, 6, 7],
                f: 'arg1',
                _: ['arg2', 'arg3'],
                aa: true,
                h: 'hello',
                H: 'hello'
            });

            done();
        });

        it('copies values into all of a key\'s aliases', function (done) {

            var line = '--path ./usr/home/bin -c -T 1-4,6-7 --time 9000';
            var definition = {
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

            var argv = parse(line, definition);
            expect(argv).to.not.be.instanceof(Error);
            expect(argv).to.deep.equal({
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

            done();
        });

        it('returns error message when required parameter is missing', function (done) {

            var line = '-a';
            var definition = {
                a: {
                    type: 'boolean'
                },
                b: {
                    type: 'number',
                    require: true
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.be.instanceof(Error);

            done();
        });

        it('returns error message when an unknown argument is used', function (done) {

            var line = '-ac';
            var definition = {
                a: {
                    type: 'boolean'
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.be.instanceof(Error);

            done();
        });

        it('returns error message when an empty - is passed', function (done) {

            var line = '-';
            var definition = {
                a: {
                    type: 'boolean'
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.be.instanceof(Error);

            done();
        });

        it('returns error message when an empty -- is passed', function (done) {

            var line = '--';
            var definition = {
                a: {
                    type: 'boolean'
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.be.instanceof(Error);

            done();
        });

        it('returns error message when an empty value is passed', function (done) {

            var line = '-b -a';
            var definition = {
                a: {
                    type: 'string'
                },
                b: {
                    type: 'string'
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.be.instanceof(Error);

            done();
        });

        it('returns error message when a non-number value is passed for a number argument', function (done) {

            var line = '-a hi';
            var definition = {
                a: {
                    type: 'number'
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.be.instanceof(Error);

            done();
        });

        it('returns undefined when an empty value is passed for a range', function (done) {

            var line = '-a';
            var definition = {
                a: {
                    type: 'range'
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.deep.equal({ a: undefined });

            done();
        });

        it('is able to parse a range plus an additional number', function (done) {

            var line = '-a 1-2,5';
            var definition = {
                a: {
                    type: 'range'
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.deep.equal({ a: [1, 2, 5] });

            done();
        });

        it('is able to parse a range in reverse order', function (done) {

            var line = '-a 5-1';
            var definition = {
                a: {
                    type: 'range'
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.deep.equal({ a: [5, 4, 3, 2, 1] });

            done();
        });

        it('allows a boolean to be defaulted to null', function (done) {

            var line = '';
            var definition = {
                a: {
                    type: 'boolean',
                    default: null
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.deep.equal({ a: null, _: '' });

            done();
        });

        it('allows custom argv to be passed in options in place of process.argv', function (done) {

            var argv = ['node', 'cli', '-a', '1-2,5'];
            var definition = {
                a: {
                    type: 'range'
                }
            };

            var argv = Bossy.parse(definition, { argv: argv });
            expect(argv).to.deep.equal({ a: [1, 2, 5] });

            done();
        });

        it('returns error message when a value isn\'t found in the valid property', function (done) {

            var line = '-a 2';
            var definition = {
                a: {
                    type: 'number',
                    valid: 1
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.be.instanceof(Error);

            done();
        });

        it('returns error message when a value isn\'t found in array of valid values', function (done) {

            var line = '-a 4';
            var definition = {
                a: {
                    type: 'number',
                    valid: [1, 2, 3]
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.be.instanceof(Error);

            done();
        });

        it('doesn\'t return an error when the value is in the valid array', function (done) {

            var line = '-a 2';
            var definition = {
                a: {
                    type: 'number',
                    valid: [1, 2, 3]
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.deep.equal({ a: 2 });

            done();
        });

        it('doesn\'t return an error when the value is in equal to the valid value', function (done) {

            var line = '-a 0';
            var definition = {
                a: {
                    type: 'number',
                    valid: 0
                }
            };

            var argv = parse(line, definition);
            expect(argv).to.deep.equal({ a: 0 });

            done();
        });

        it('displays unrecognized arguments in error message ', function (done) {

            var line = '-a 0 -b';
            var definition = {
                a: {
                    type: 'number',
                    description: 'This needs a number'
                }
            };

            var argv = parse(line, definition);
            expect(argv.message).to.contain('Unknown option: b');

            done();
        });
    });

    describe('#usage', function () {

        it('returns formatted usage information', function (done) {

            var definition = {
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
                }
            };

            var result = Bossy.usage(definition);
            expect(result).to.contain('-a');
            expect(result).to.contain('This needs a number');
            expect(result).to.contain('-b, --beta');
            done();
        });

        it('returns formatted usage header when provided', function (done) {

            var definition = {
                h: {
                    type: 'string',
                    description: 'Show help'
                }
            };

            var result = Bossy.usage(definition, 'bossy -h');
            expect(result).to.contain('Usage: bossy -h');
            expect(result).to.contain('-h');
            expect(result).to.contain('Show help');
            done();
        });

        it('returns formatted usage information with colors when enabled', function (done) {

            var definition = {
                a: {
                    alias: 'alpha',
                    require: true,
                    description: 'Description for b'
                }
            };

            var result = Bossy.usage(definition, { colors: true });

            expect(result).to.contain('-a');
            expect(result).to.contain('\u001b[0m');
            done();
        });

        it('when colors are missing defaults to true if tty supports colors', function (done) {

            var definition = {
                a: {
                    alias: 'alpha',
                    require: true,
                    description: 'Description for b'
                }
            };

            var Tty = require('tty');
            var currentIsAtty = Tty.isatty;

            Tty.isatty = function () {

                Tty.isatty = currentIsAtty;
                return true;
            };

            var result = Bossy.usage(definition);

            expect(result).to.contain('-a');
            expect(result).to.contain('\u001b[0m');
            done();
        });

        it('when colors are missing defaults to false if tty doesn\'t support colors', function (done) {

            var definition = {
                a: {
                    alias: 'alpha',
                    require: true,
                    description: 'Description for b'
                }
            };

            var Tty = require('tty');
            var currentIsAtty = Tty.isatty;

            Tty.isatty = function () {

                Tty.isatty = currentIsAtty;
                return false;
            };

            var result = Bossy.usage(definition);

            expect(result).to.contain('-a');
            expect(result).to.not.contain('\u001b[0m');
            done();
        });

        it('returns colors usage information when passed as parameter', function (done) {

            var definition = {
                a: {
                    alias: 'alpha',
                    require: true,
                    description: 'Description for b'
                }
            };

            var result = Bossy.usage(definition, 'bossy -c', { colors: true });

            expect(result).to.contain('bossy');
            expect(result).to.contain('-a');
            expect(result).to.contain('\u001b[0m');
            done();
        });

        it('formatted usage message orders as -s,--long in first column', function (done) {

            var definition = {
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

            var result = Bossy.usage(definition);
            expect(result).to.contain('-a');
            expect(result).to.contain('-b, --beta');
            expect(result).to.contain('-c, --code');
            done();
        });
    });
});

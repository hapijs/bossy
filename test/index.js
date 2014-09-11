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
                h: 'hello',
                _: ['arg2', 'arg3']
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
    });
});
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

    it('displays error message when required parameter is missing', function (done) {

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

    it('displays error message when an unknown argument is used', function (done) {

        var line = '-ac';
        var definition = {
            a: {
                type: 'true'
            }
        };

        var argv = parse(line, definition);
        expect(argv).to.be.instanceof(Error);

        done();
    });

    it('displays error message when an empty argument is passed', function (done) {

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
});
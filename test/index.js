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

        var line = '-a -cb --aa -C 1 -d x -d 2 -e 1-4 -f arg1 arg2 arg3';
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
                type: 'boolean'
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
            e: [1, 2, 3, 4],
            f: 'arg1',
            _: ['arg2', 'arg3']
        });

        done();
    });
});
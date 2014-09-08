# bossy

Command line options parser.

[![Build Status](https://secure.travis-ci.org/hapijs/bossy.png)](http://travis-ci.org/hapijs/bossy)

Lead Maintainer - [Wyatt Preul](https://github.com/geek)


## Usage

```js
var Bossy = require('bossy');

var definition = {
    h: {
        description: 'Show help',
        alias: 'help',
        type: 'boolean'
    },
    n: {
        description: 'Show your name',
        alias: 'name'
    }
};


try {
    var args = Bossy.parse(definition);
} catch(err) {

    console.error(err.message);
    return;
}

if (args.h || !args.n) {
    console.log(Bossy.usage(definition, 'hello -n <name>'));
    return;
}

console.log('Hello ' + args.n);
```

## Methods

### `parse(definition)`

Expects a *bossy* definition object and will return the parsed `process.argv` arguments provided.


### `usage(definition, [usage])`

Format a  *bossy* definition object for display in the console.  If `usage` is provided the returned value will
include the usage value formatted at the top of the message.


## Definition Object

The definition object should be structured with each object key representing the short form of an available command
line argument.  Each argument key supports the following properties:

* `alias`: A string or array of strings that can also be used as the argument name.  For example:
```
h: {
    alias: 'help'
}
```

* `type`: Available types are: `boolean`, `range`, `number`, `string`.  Defaults to `string`.

* `description`: Description message that will be returned with usage information.

* `require`: Boolean to indicate if the argument is required.  Defaults to `false`

* `default`: A default value to assign to the argument if its not provided as an argument.

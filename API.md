
## Usage

```js
const Bossy = require('@hapi/bossy');

const definition = {
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

const args = Bossy.parse(definition);

if (args instanceof Error) {
    console.error(args.message);
    return;
}

if (args.h || !args.n) {
    console.log(Bossy.usage(definition, 'hello -n <name>'));
    return;
}

console.log('Hello ' + args.n);
console.log('Hello ' + args.name);
```

## Methods

### `parse(definition, [options])`

Expects a *bossy* definition object and will return the parsed `process.argv` arguments provided.  If there is an error
then the return value will be an `instanceof Error`.

Options accepts the following keys:
* `argv` - custom argv array value.  Defaults to process.argv.

### `usage(definition, [usage], [options])`

Format a  *bossy* definition object for display in the console.  If `usage` is provided the returned value will
include the usage value formatted at the top of the message.

Options accepts the following keys:
* `colors` - Determines if colors are enabled when formatting usage.  Defaults to whatever TTY supports.

### `object(name, parsed)`

Un-flattens dot-separated arguments based at `name` from `Bossy.parse()`'s output into an object.

```js
const Bossy = require('@hapi/bossy');

const definition = {
    'pet.name': {
        type: 'string'
    },
    'pet.age': {
        type: 'number'
    }
};

// Example CLI args: --pet.name Maddie --pet.age 5

const parsed = Bossy.parse(definition);     // { 'pet.name': 'Maddie', 'pet.age': 5 }

if (parsed instanceof Error) {
    console.error(parsed.message);
    return;
}

const pet = Bossy.object('pet', parsed);    // { name: 'Maddie', age: 5 }
```

## Definition Object

The definition object should be structured with each object key representing the short form of an available command
line argument.  Each argument key supports the following properties:

* `alias`: A string or array of strings that can also be used as the argument name.  For example:

    ```js
    h: {
        alias: 'help'
    }
    ```

* `type`: Available types are: `boolean`, `range`, `number`, `string`, `json`, and `help`.  Defaults to `string`.

    `help` is a special type that allows the switch to be executed even though
    other paramters are required. Use case is to display a help message and
    quit. This will bypass all other errors, so be sure to capture it. It
    behaves like a `boolean`.

    The `json` type allows building an object using command line arguments that utilize
    dot-separated (`.`) paths and JSON values. For example, an object argument named
    `pet` might be built from `--pet '{ "type": "dog" }' --pet.name Maddie`, resulting in
    the parsing output `{ pet: { type: 'dog', name: 'Maddie' } }`.  The contents of the
    flags are deeply merged together in the order they were specified.  Additionally,
    JSON primitives (i.e. `null`, booleans, and numbers) are treated as strings by default,
    though this behavior may be controlled with the `parsePrimitives` option documented
    below.  The following example demonstrates the default behavior:

    ```sh
    # CLI input
    create-pet --pet.type kangaroo --pet.legs 2 --pet.mammal true \
               --pet '{ "name": "Maddie", "type": "dog" }' --pet.legs 4
    ```
    ```js
    // Parsing output
    { pet: { name: 'Maddie', type: 'dog', legs: '4', mammal: 'true' } }
    ```

* `multiple` : Boolean to indicate if the same argument can be provided multiple times. If true, the parsed value
will always be an array of `type`'s. Defaults to `false`. Does not apply to `json` type arguments.

* `description`: Description message that will be returned with usage information.

* `require`: Boolean to indicate if the argument is required.  Defaults to `false`

* `default`: A default value to assign to the argument if its not provided as an argument.

* `valid`: A value or array of values that the argument is allowed to equal. Does not apply to `json` type arguments.

* `parsePrimitives`: When `true`, arguments of the `json` type will parse JSON primitives rather than treat them as strings.  For example, `--pet.name null` will result in the output `{ pet: { name: 'null' } }` by default.  However, when `parsePrimitives` is `true`, the same input would result in the output `{ pet: { name: null } }`.  The same applies for other JSON primitives too, i.e. booleans and numbers.  When this option is `true`, users may represent string values as JSON in order to avoid ambiguity, e.g. `--pet.name '"null"'`.  It's recommended that applications using this option document the behavior for their users.

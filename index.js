const meow      = require('meow');
const start     = require('./start');

const cli = meow();

if (cli.input.length) {
    if (cli.input[0] === 'config') {
        start();
    }
    else {
        start();
    }
}

else {
    start();
}
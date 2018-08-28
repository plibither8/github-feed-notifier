const meow      = require('meow');
const start     = require('./start');
const feedUrl   = require('./data.json').feedUrl;

const cli = meow();

if (cli.input.length) {
    if (cli.input[0] == 'config') {
        start();
    }
    else {
        start();
    }
}

else {
    start();
}
const notifier    = require('node-notifier');
const start       = require('./start');
const config      = require('./config.js');
const configData  = require('./config.json');

const args        = process.argv;
const feedUrl     = configData.feedUrl;

if (args.indexOf('config') > -1) {
    (async () => {
        await config();
        start();
    })();
}

else {

    if (feedUrl === null) {

        notifier.notify({
            title: 'Error: GitHub Feed Notifier',
            message: 'You have not set your feed URL.<br>Run `gfn config` to set URL. Check GitHub repository for help.',
            sound: true
        });

        console.error('\x1b[1m\x1b[31m%s\x1b[0m', '\nERROR: github-feed-notifier: feed URL not set or invalid.');
        console.error('Run \x1b[1m`gnf config`\x1b[0m to set your GitHub feed URL, amongst other configurations.\nVisit \x1b[1mhttps://github.com/plibither8/github-feed-notifier\x1b[0m for help in finding personal feed URL.');

    }

    else {
        start();
    }

}
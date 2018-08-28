const fs               = require('fs');
const { promisify }    = require('util');
const { prompt }       = require('inquirer');
const path             = require('path');
const writeFile        = promisify(fs.writeFile);

const write = async (obj) => {
    const jsonString = JSON.stringify(obj, null, '  ');
    await writeFile(path.join(__dirname, './config.json'), jsonString, 'utf8', (err) => {
        if (err) {
            throw err;
        }
        else {
            console.log('\x1b[1m\x1b[32m%s\x1b[0m', '\n✔️ Configuration saved!', 'You can now start using github-feed-notifier');
        }
    });
};

module.exports = async () => {

    process.stdout.write('\n');
    const {
        feedUrl,
        refreshDelay,
        maxNotificationDisplay
    } = await prompt([{
        type: 'input',
        name: 'feedUrl',
        message: 'GitHub feed URL',
        default: require('./config.json').feedUrl ? require('./config.json').feedUrl : null
    },
    {
        type: 'input',
        name: 'refreshDelay',
        message: 'Refresh delay (milliseconds)',
        default: 60000
    },
    {
        type: 'input',
        name: 'maxNotificationDisplay',
        message: 'Maximum number of notifications to display at a time',
        default: 3
    }
    ]);

    const configObj = {
        feedUrl: feedUrl,
        refreshDelay: Math.floor(Number(refreshDelay)),
        maxNotificationDisplay: Math.floor(Number(maxNotificationDisplay))
    };

    await write(configObj);

};
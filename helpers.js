const request        = require('request-promise');
const fs             = require('fs');
const { promisify }  = require('util');
const path           = require('path');

const writeFile      = promisify(fs.writeFile);

const imageCheckAndDownload = (uri, filename, callback) => {
    if (!fs.existsSync(filename)) {
        request.head(uri, (err, res, body) => {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    }
    else {
        callback();
    }
};

const updateJson = async (data) => {
    await writeFile(path.join(__dirname, './resources/data.json'), JSON.stringify(data), 'utf8', (err) => {
        if (err) {
            throw err;
        }
        else {
        }
    });
}

module.exports.imageCheckAndDownload = imageCheckAndDownload;
module.exports.updateJson = updateJson;
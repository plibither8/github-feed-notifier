const request        = require('request-promise');
const fs             = require('fs');
const { promisify }  = require('util');
const path           = require('path');

const writeFile      = promisify(fs.writeFile);

const imageDownload = (uri, filename, callback) => {
    request.head(uri, (err, res, body) => {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

const updateJson = async (data) => {
    await writeFile(path.join(__dirname, './data.json'), JSON.stringify(data), 'utf8', (err) => {
        if (err) {
            throw err;
        }
        else {
            console.log('file saved');
        }
    });
}

module.exports.imageDownload = imageDownload;
module.exports.updateJson = updateJson;
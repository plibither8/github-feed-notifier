'use strict';

const request = require('request-promise');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const writeFile = promisify(fs.writeFile);

const searchImageUrl = url => {
    const urlList = require('./resources/data.json').cachedUrls;
    return urlList.indexOf(url);
};

const writeToDataJson = async data => {
    await writeFile(path.join(__dirname, './resources/data.json'), JSON.stringify(data, null, '  '), 'utf8', err => {
        if (err) {
            throw err;
        }
    });
};

const imageCheckAndDownload = (url, filename, callback) => {
    if (searchImageUrl(url) > -1) {
        callback();
    } else {
        request.head(url, () => request(url).pipe(fs.createWriteStream(filename)).on('close', callback));
        let dataCopy = require('./resources/data.json');
        dataCopy.cachedUrls.push(url);
        writeToDataJson(dataCopy);
    }
};

module.exports.imageCheckAndDownload = imageCheckAndDownload;
module.exports.writeToDataJson = writeToDataJson;
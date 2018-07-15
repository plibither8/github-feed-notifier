const { writeFile }  = require('fs');
const request        = require('request-promise');
const Parser         = require('rss-parser');
const notifier       = require('node-notifier');

const data           = require('./.data.json');
const {atob, btoa}   = require('./helpers.js');

const feedURL = data.url;

let jsonFeed,
    lastId = data.lastId;

const getFeed = async (url) => {
    let xmlString;
    console.log('checl');
    await request(url, (err, status, body) => {
        xmlString = body;
        if (err) {
            console.log('shiz');
        }
    });
    // console.log(btoa(xmlString).substr(0,5));
    return new Promise((resolve, reject) => {
        resolve(xmlString);
    })
};

const parseFeed = async (str) => {
    const parser = new Parser;
    const jsonFeed = await parser.parseString(str);
    // console.log(jsonFeed);
    return jsonFeed;
};

const setLastId = async () => {
    const dataObj = {};
    dataObj.url = data.url;
    if (lastId === null) {
        lastId = parseFeed(getFeed(feedURL)).items.reverse()[0].id;
    } else {
        dataObj.lastId = lastId;
    }
    return new Promise((resolve, reject) => {
        writeFile('.data.json', JSON.stringify(dataObj), (err) => {
            if (err) {
                console.log('gg');
                reject(err);
            } else {
                console.log('donezo');
                resolve();
            }
        });
    });
};

const getLastId = async () => {
    return new Promise((resolve, reject) => {
        if (lastId === null) {
            setLastId();
            resolve(lastId);
        } else {
            resolve(lastId);
        }
    });
};

const compare = async (feed) => {
    let lastId      = await getLastId();
    let unreadItems = [];
    const itemList = feed.items;
    itemList.map((item, index) => {
        if (item.id === lastId) {
            lastId = itemList[0].id;
            return;
        } else {
            unreadItems.push(item);
        }
    });
    setLastId();
    return unreadItems;
};

// compare(parseFeed(getFeed(feedURL)));

notifier.notify(
    {
        title: 'GitHub Feed',
        message: 'plibither8 starred plibither8/markdown-new-tab',
        sound: true,
        wait: true
    },
    function (err, response) {}
);

(async () => {
    (async () => {
        console.log(await parseFeed(await getFeed(feedURL)))
    })()
})()
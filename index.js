const { writeFile }  = require('fs');
const request        = require('request-promise');
const rssParser      = require('rss-parser');
const notifier       = require('node-notifier');
const htmlParser     = require('node-html-parser');

const data           = require('./.data.json');
const {atob, btoa}   = require('./helpers.js');

const feedURL = data.url;

let jsonFeed,
    lastId = data.lastBuildDate;

const getFeed = async (url) => {
    let xmlString;
    await request(url, (err, status, body) => {
        xmlString = body;
        if (err) {
            console.log('shiz');
        }
    });
    return new Promise((resolve, reject) => {
        resolve(xmlString);
    })
};

const parseFeed = async (str) => {
    const parseFeed = new rssParser;
    const jsonFeed = await parseFeed.parseString(str);
    const refinedJsonFeed = {
        lastUpdated: jsonFeed.lastBuildDate,
        feedUrl: jsonFeed.feedUrl,
        items: []
    };

    jsonFeed.items.map(item => {
        refinedJsonFeed.items.push({
            id: item.id,
            title: item.title,
            author: item.author,
            img: htmlParser.parse(item.content).querySelector('img').attributes.src
        });
    });

    return refinedJsonFeed;
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

notifier.notify(
    {
        title: 'GitHub Feed',
        message: 'plibither8 starred plibither8/markdown-new-tab',
        sound: true,
        wait: true
    },
    (err, res) => {
        console.log('hello');
    }
);

(async () => {
    const feed = await parseFeed(await getFeed(feedURL));
    console.log(feed)
})()
const request        = require('request-promise');
const rssParser      = require('rss-parser');
const notifier       = require('node-notifier');
const htmlParser     = require('node-html-parser');
const path           = require('path');
const open           = require('open');
const fs             = require('fs');
const { promisify }  = require('util');
const writeFile      = promisify(fs.writeFile);

const {atob, btoa}   = require('./helpers.js');
let data             = require('./.data.json');

const feedUrl = data.url;

let jsonFeed;

const getFeed = async (url) => {
    let xmlString;
    await request(url, (err, status, body) => {
        xmlString = body;
        if (err) {
            throw err;
        }
    });
    return new Promise((resolve, reject) => {
        resolve(xmlString);
    })
};

const parseFeed = async (str) => {
    const parsedJsonFeed = await (new rssParser).parseString(str);
    const refinedJsonFeed = {
        lastUpdated: (new Date(parsedJsonFeed.lastBuildDate)).getTime(),
        feedUrl: parsedJsonFeed.feedUrl,
        items: []
    };

    parsedJsonFeed.items.map(item => {
        refinedJsonFeed.items.push({
            id: item.id,
            time: (new Date(item.pubDate)).getTime(),
            title: item.title,
            author: item.author,
            img: htmlParser.parse(item.content).querySelector('img').attributes.src,
            link: item.link
        });
    });

    console.log(refinedJsonFeed);
    return refinedJsonFeed;
};

const getRefinedFeed = async () => {
    return await parseFeed(await getFeed(feedUrl));
};

const setLastUpdated = async (lastUpdatedParam = data.lastUpdated) => {
    let dataCopy = Object.assign({}, data);
    let currLastUpdated,
        prevLastUpdated = lastUpdatedParam;

    if (prevLastUpdated === null) {
        const feedItems = (await getRefinedFeed()).items;
        if (feedItems.length > 3) {
            currLastUpdated = feedItems[2].time;
        }
        else {
            currLastUpdated = feedItems[feedItems.length - 1].time;
        }
    }
    else {
        currLastUpdated = lastUpdatedParam;
    }

    dataCopy.lastUpdated = currLastUpdated;

    await writeFile(path.join(__dirname, './.data.json'), JSON.stringify(dataCopy), 'utf8', (err) => {
        if (err) {
            throw err;
        }
        else {
            console.log('file saved');
        }
    });
};

const getLastUpdated = () => {
    return require('./.data.json').lastUpdated;
};

const getUnreadItems = async () => {
    const feed         = await getRefinedFeed();
    const itemList     = feed.items;
    let lastUpdated    = getLastUpdated();
    let unreadItems    = [];

    for (const item of itemList) {
        if (item.time === lastUpdated) {
            lastUpdated = feed.lastUpdated;
            break;
        } else {
            unreadItems.push(item);
            if (unreadItems.length === 3) {
                lastUpdated = feed.lastUpdated;
                break;
            }
        }
    }

    setLastUpdated(lastUpdated);
    return unreadItems;
};

const imageDownload = (uri, filename, callback) => {
    request.head(uri, (err, res, body) => {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

(async () => {

    setLastUpdated();

    const unreadItems = await getUnreadItems();
    unreadItems.map(item => {

        const imageUrl = item.img;
        const imageDest = path.join(__dirname, ('./cache/'+item.author+'.png'));

        imageDownload(imageUrl, imageDest, () => {
            notifier.notify({
                title: `${item.author} - GitHub`,
                message: item.title,
                icon: imageDest,
                sound: true,
                wait: true
            });
        });

    })
})()
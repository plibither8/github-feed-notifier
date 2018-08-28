const request        = require('request-promise');
const rssParser      = require('rss-parser');
const notifier       = require('node-notifier');
const htmlParser     = require('node-html-parser');
const path           = require('path');
const open           = require('open');
const isOnline       = require('is-online');

const {
    imageDownload,
    updateJson
}                    = require('./helpers');
const feedUrl        = require('./data.json').url;

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
    });

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

    return refinedJsonFeed;
};

const getRefinedFeed = async () => {
    return await parseFeed(await getFeed(feedUrl));
};

const getLastUpdated = () => {
    return require('./data.json').lastUpdated;
};

const setLastUpdated = async (prevLastUpdated = getLastUpdated()) => {
    let dataCopy = require('./data.json');
    let currLastUpdated;

    if (prevLastUpdated === null) {
        const feedItems = (await getRefinedFeed()).items;
        if (feedItems.length > 3) {
            currLastUpdated = feedItems[3].time;
        }
        else {
            currLastUpdated = feedItems[feedItems.length - 1].time;
        }
    }
    else {
        currLastUpdated = prevLastUpdated;
    }

    dataCopy.lastUpdated = currLastUpdated;
    updateJson(dataCopy);

};

const getUnreadItems = async () => {
    const feed       = await getRefinedFeed();
    const itemList   = feed.items;
    let lastUpdated  = getLastUpdated();
    let unreadItems  = [];

    for (const item of itemList) {
        if (item.time === lastUpdated) {
            break;
        } else {
            unreadItems.push(item);
            if (unreadItems.length === 5) {
                break;
            }
        }
    }

    if (unreadItems.length > 0) {
        console.log(unreadItems);
        lastUpdated = feed.lastUpdated;
        setLastUpdated(lastUpdated);
    } else {
        console.log('No new items');
    }

    return unreadItems;
};

const notify = (item, imageDest) => {
    notifier.notify({
        title: `${item.author} - GitHub`,
        message: item.title,
        icon: imageDest,
        sound: true,
        wait: true,
        timeout: 5
    });
};

module.exports = () => {

    setLastUpdated();
    let refreshCount = 0;

    setInterval(async () => {
        let online;
        await isOnline().then(bool => online = bool);

        if (online) {
            (await getUnreadItems()).map(item => {

                const imageUrl = item.img;
                const imageDest = path.join(__dirname, `./cache/${item.author}.png`);

                setTimeout(() => {
                    imageDownload(imageUrl, imageDest, () => notify(item, imageDest));
                }, 10 * 1000);

            });
            console.log('Refresh count:', ++refreshCount);
            console.log('===================');
        }
        else {
            console.log('no internet');
        }

    }, 60*1000);

};
const request        = require('request-promise');
const rssParser      = require('rss-parser');
const notifier       = require('node-notifier');
const htmlParser     = require('node-html-parser');
const path           = require('path');
const isOnline       = require('is-online');

const {
    imageCheckAndDownload,
    writeToDataJson
}                    = require('./helpers');
const {
    feedUrl,
    refreshDelay,
    maxNotificationDisplay
}                    = require('./config.json');

const getFeed = async () => {

    let xmlString;
    await request(feedUrl, (err, status, body) => {
        xmlString = body;
        if (err) {
            throw err;
        }
    });
    return xmlString;

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
    return parseFeed(await getFeed());
};

const getLastUpdated = () => {
    return require('./resources/data.json').lastUpdated;
};

const setLastUpdated = async (prevLastUpdated = getLastUpdated()) => {
    let dataCopy = require('./resources/data.json');
    let currLastUpdated;

    if (prevLastUpdated === null) {
        const feedItems = (await getRefinedFeed()).items;
        if (feedItems.length > maxNotificationDisplay) {
            currLastUpdated = feedItems[maxNotificationDisplay].time;
        }
        else {
            currLastUpdated = feedItems[feedItems.length - 1].time;
        }
    }
    else {
        currLastUpdated = prevLastUpdated;
    }

    dataCopy.lastUpdated = currLastUpdated;
    writeToDataJson(dataCopy);
};

const getUnreadItems = async () => {
    const feed        = await getRefinedFeed();
    const itemList    = feed.items;
    const lastUpdated = getLastUpdated();
    let unreadItems   = [];

    for (const item of itemList) {
        if (item.time === lastUpdated) {
            break;
        } else {
            unreadItems.push(item);
            if (unreadItems.length === maxNotificationDisplay) {
                break;
            }
        }
    }

    if (unreadItems.length > 0) {
        console.log(unreadItems);
        setLastUpdated(feed.lastUpdated);
    } else {
        console.log('No new items');
    }

    return unreadItems;
};

const notify = (item, imageDest) => {
    notifier.notify({
        title: item.author,
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
                const imageDest = path.join(__dirname, `./resources/cache/${item.author}.png`);

                setTimeout(() => {
                    imageCheckAndDownload(imageUrl, imageDest, () => notify(item, imageDest));
                }, 10 * 1000);

            });
            console.log('Refresh count:', ++refreshCount);
            console.log('===================');
        }
        else {
            console.log('no internet');
        }

    }, refreshDelay);

};
const btoa = (str) => {
    return Buffer.from(str, 'binary').toString('base64');
};

const atob = (str) => {
    return Buffer.from(str, 'base64').toString('binary');
};

exports.atob = atob;
exports.btoa = btoa;
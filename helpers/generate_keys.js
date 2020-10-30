const crypto = require('crypto');

console.table({
    key1: crypto.randomBytes(32).toString('hex'),
    key2: crypto.randomBytes(32).toString('hex')
});
const fs = require('fs');
fs.writeFileSync('node_success.txt', 'NODE_WORKED');
console.log('Internal write completed');

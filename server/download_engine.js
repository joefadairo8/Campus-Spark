import https from 'https';
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

const hash = '8659f92d08d39470565db36f8b29a82bac8cec5e';
const url = `https://binaries.prisma.io/all_commits/${hash}/debian-openssl-1.0.x/libquery_engine.so.node.gz`;
const outputPath = './libquery_engine-debian-openssl-1.0.x.so.node';

console.log(`Downloading: ${url}`);

https.get(url, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Status Code: ${response.statusCode}`);
        return;
    }

    const gunzip = zlib.createGunzip();
    const fileStream = fs.createWriteStream(outputPath);

    response.pipe(gunzip).pipe(fileStream);

    fileStream.on('finish', () => {
        console.log(`Successfully downloaded and extracted to: ${outputPath}`);
        process.exit(0);
    });

    fileStream.on('error', (err) => {
        console.error(`File Stream Error: ${err.message}`);
    });
}).on('error', (err) => {
    console.error(`Request Error: ${err.message}`);
});

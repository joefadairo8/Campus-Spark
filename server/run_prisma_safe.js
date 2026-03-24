
const { execSync } = require('child_process');
const fs = require('fs');

const logFile = 'prisma_execution_final.log';

function run(cmd) {
    fs.appendFileSync(logFile, `\n--- Running: ${cmd} ---\n`);
    try {
        const out = execSync(cmd, { stdio: 'pipe' });
        fs.appendFileSync(logFile, out.toString());
        fs.appendFileSync(logFile, '\nSUCCESS\n');
    } catch (e) {
        fs.appendFileSync(logFile, `ERORR: ${e.message}\n${e.stdout?.toString()}\n${e.stderr?.toString()}\n`);
    }
}

fs.writeFileSync(logFile, `Execution started at ${new Date().toISOString()}\n`);
run('npx prisma db push --accept-data-loss');
run('npx prisma generate');
console.log('Execution finished. Check prisma_execution_final.log');

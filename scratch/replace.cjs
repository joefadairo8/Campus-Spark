const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'server/src/emailService.ts',
  'server/src/index.ts',
  'server/server_log.txt',
  'firebase.ts',
  'emailNotifier.ts',
  'constants.tsx',
  'components/CreatorsPage.tsx',
  'components/CreateAccountPage.tsx',
  'components/CreatorDashboard.tsx',
  'components/BrandsPage.tsx',
  'components/AssociationDashboard.tsx',
  'components/AdminDashboard.tsx',
  'README.md',
  'PROJECT_BRIEF.md'
];

for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace Campus Spark case-insensitively
    content = content.replace(/Campus Spark/g, 'ABC-Rally');
    content = content.replace(/campus spark/g, 'ABC-Rally');
    content = content.replace(/CAMPUS SPARK/g, 'ABC-RALLY');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}

const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'FE/src/pages/driver'),
  path.join(__dirname, 'FE/src/components/ui')
];

const replacements = [
  { regex: /hover:bg-gray-50 dark:bg-slate-900\/50/g, replace: 'hover:bg-gray-50 dark:hover:bg-slate-800' }
];

function processDir(directory) {
  const files = fs.readdirSync(directory);
  let changedFiles = 0;

  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      changedFiles += processDir(fullPath);
    } else if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      replacements.forEach(({ regex, replace }) => {
        content = content.replace(regex, replace);
      });

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
      }
    }
  });

  return changedFiles;
}

dirs.forEach(dir => {
  const total = processDir(dir);
  console.log(`Total files updated in ${dir}: ${total}`);
});

const fs = require('fs');
const path = require('path');

const pathProjectRoot = path.join(__dirname, '..');
const ignoreFolders = ['node_modules', 'locales', '.git', '.idea'];

// Read all JSON files in the current directory
const jsonFiles = fs.readdirSync(path.join(pathProjectRoot, 'locales')).filter(file => file.endsWith('.json'));

// Get the unique existing keys from the default locale
let existingKeys = new Set();
let mapFileJson = [];
for (let file of jsonFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(pathProjectRoot, 'locales', file), 'utf8'));
    for (let key of Object.keys(data)) {
        existingKeys.add(key);
    }
    // Add mapping file -> JSON
    mapFileJson.push({file, data});
}


// Walk directory to gather all JS and Pug files
const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        if (ignoreFolders.includes(file)) return;
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walkSync(filepath, filelist);
        } else {
            filelist.push(filepath);
        }
    });
    return filelist;
}

const allFiles = walkSync(pathProjectRoot);
const jsFiles = allFiles.filter(file => file.endsWith('.js'));
const pugFiles = allFiles.filter(file => file.endsWith('.pug'));


// Find all the keys in the JS by __() and Pug by #{__()}
let allKeys = new Set();

for (let file of [jsFiles, pugFiles].flat()) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /__\((['"])(.*?)\1\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        allKeys.add(match[2]);
    }
}


// Add keys to each locale file respectively following the order of the allKeys, skip if the key already exists
for (let {file, data} of mapFileJson) {
    for (let key of allKeys) {
        if (!data[key]) {
            data[key] = '';
        }
    }
    // Remove keys that are not in allKeys
    for (let key of Object.keys(data)) {
        if (!allKeys.has(key)) {
            delete data[key];
        }
    }
    fs.writeFileSync(path.join(pathProjectRoot, 'locales', file), JSON.stringify(data, null, 4));
}

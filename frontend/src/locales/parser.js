// locales/parser.js
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

// Smart sorting algorithm
const customSort = (a, b) => {
    let order = 0;
    const priorityGroups = [
        // Number ^\d+$ or Date \w\s\d{4} or Date-time
        {test: (k) => /^\d+$/.test(k) || /\w\s\d{4}/.test(k) || /\d{4}-\d{2}-\d{2}/.test(k), order: order++},
        
        // Core UI elements
        {test: (k) => ["Home", "About Me", "Contact", "Education", "Internships"].includes(k), order: order++},

        // UserModel authentication
        {test: (k) => /(Sign|Log|Passw|UserModel|account)/i.test(k), order: order++},

        // Contact information
        {test: (k) => ["Email", "Phone", "Birthday", "Location"].includes(k), order: order++},

        // Education-related terms
        {test: (k) => /(Institut|University|Master|Bachelor|Diploma|Engineer)/i.test(k), order: order++},

        // Internship-related terms
        {test: (k) => /(Porsche|Bank|Institute|Research|Intern|Assistant|Developer)/i.test(k), order: order++},

        // Long-form content (About Me paragraphs)
        {test: (k) => k.length > 60, order: order++},

        // Dates and locations
        {test: (k) => /\d{4}/.test(k) || /(Paris|Shanghai|France|China)/i.test(k), order: order++},
    ];

    const getOrder = (key) => {
        const group = priorityGroups.find(g => g.test(key));
        return group ? group.order : 7; // Default group
    };

    const aOrder = getOrder(a);
    const bOrder = getOrder(b);

    return aOrder - bOrder || a.localeCompare(b);
};

// Modified file processing section
for (let {file, data} of mapFileJson) {
    // Create sorted key array
    const sortedKeys = Array.from(allKeys).sort(customSort);

    // Create new sorted object
    const sortedData = {};
    for (const key of sortedKeys) {
        sortedData[key] = data[key] || '';
    }

    // Write sorted file
    fs.writeFileSync(
        path.join(pathProjectRoot, 'locales', file),
        JSON.stringify(sortedData, (k, v) => v, 4) // Maintain pretty print
    );
}

// Report the missing keys
const missingKeys = new Set();
for (let key of allKeys) {
    if (!existingKeys.has(key)) {
        missingKeys.add(key);
    }
}

if (missingKeys.size > 0) {
    console.log('The following keys are missing in the default locale:');
    for (let key of missingKeys) {
        console.log(key);
    }
}
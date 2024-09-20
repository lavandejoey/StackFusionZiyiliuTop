const i18n = require('i18n');
const path = require('path');

i18n.configure({
    // Define the languages you want to support
    locales: ['en', 'fr', 'zh-CN', 'zh-HK'], // More standard locale codes for Chinese

    // Directory where translation JSON files are stored
    directory: path.join(__dirname, 'locales'),

    // Set the default locale
    defaultLocale: 'en',

    // Enable automatic language detection based on headers
    queryParameter: 'lang', // Optional: allows switching by ?lang=fr in URL
    cookie: 'locale', // Optional: set language via cookies

    // Automatically update JSON files if a new key is introduced
    autoReload: false, // Reloading is unnecessary if updateFiles is false
    updateFiles: false, // Avoid automatic updates of language files to maintain consistency
});

module.exports = i18n

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const geoip = require('geoip-lite');
const i18n = require('./i18nConfig');
const auth = require('basic-auth');

const indexRouter = require('./routes/index');
const aboutMeRouter = require('./routes/about_me');
const contactRouter = require('./routes/contact');
const usersRouter = require('./routes/users');
const monitorRouter = require('./routes/monitor');
const v2rayRouter = require('./routes/v2ray');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(sassMiddleware({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true, // true = .sass and false = .scss
    sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));
// Middleware to handle language switching
app.use(i18n.init); // Initialize i18n middleware
app.use((req, res, next) => {
    // Set default language
    let lang = req.cookies.locale || 'en'; // Use cookie if available, otherwise default to 'en'

    // Get browser/system language
    const browserLang = req.headers['accept-language']?.split(',')[0];

    // Supported languages map by country
    const countryLangMap = {
        'US': 'en', 'GB': 'en', 'AU': 'en', 'NZ': 'en', 'SG': 'en', // English-speaking countries
        'FR': 'fr', 'BE': 'fr', 'CA': 'fr', 'CH': 'fr', 'LU': 'fr', 'MC': 'fr', // French-speaking countries
        'CI': 'fr', 'SN': 'fr', 'MG': 'fr', 'CD': 'fr', 'BF': 'fr', 'NE': 'fr', 'ML': 'fr', 'TD': 'fr', 'GN': 'fr', 'CM': 'fr',
        'CN': 'zh-CN', // Simplified Chinese for Mainland China
        'HK': 'zh-HK', 'MO': 'zh-HK', 'TW': 'zh-HK', 'MY': 'zh-HK', 'ID': 'zh-HK' // Traditional Chinese
    };

    // Detect language from query parameter (for language switcher)
    if (req.query.lang && i18n.getLocales().includes(req.query.lang)) {
        lang = req.query.lang;
    }
    // Fallback to browser language if supported
    else if (browserLang && i18n.getLocales().includes(browserLang)) {
        lang = browserLang;
    }
    // Fallback to country-based language detection
    else {
        const geo = geoip.lookup(req.ip || req.connection.remoteAddress);
        lang = geo ? (countryLangMap[geo.country] || 'en') : 'en';
    }

    // Set the language and store in cookie
    res.setLocale(lang);
    res.cookie('locale', lang);
    console.log("Detected language: " + lang);
    next();
});

// Authentication middleware for /monitor route
const monitorAuth = (req, res, next) => {
    const user = auth(req);
    const authorizedUsername = "zliu2069";
    const authorizedPassword = "?:*O65|CL0|?/3H2K$uUnnH.1b+tickAY{++`e:n={gwRUpU_+";

    if (user && user.name === authorizedUsername && user.pass === authorizedPassword) {
        next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm="Monitor Section"');
        return res.status(401).send('Authentication required.');
    }
};

// Define global variable
if (process.env.NODE_ENV === 'production') {
    app.locals.domain = 'https://ziyiliu.top/';
} else {
    app.locals.domain = 'http://localhost:2069/';
}
app.locals.title = 'ZLiu';
app.locals.author = 'Ziyi LIU';

app.use('/', indexRouter);
app.use('/about_me', aboutMeRouter);
app.use('/contact', contactRouter);
app.use('/users', usersRouter);
app.use('/monitor', monitorAuth, monitorRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

// Load environment variables
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('sass-middleware');
const geoIp = require('geoip-lite');
const i18n = require('./i18nConfig');
const auth = require('basic-auth');
// Routes
const indexRouter = require('./routes/index');
const aboutMeRouter = require('./routes/about_me');
const contactRouter = require('./routes/contact');
const monitorRouter = require('./routes/monitor');
const v2rayRouter = require('./routes/v2ray');
const sass = require('sass');

// Create express app
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
        src: path.join(__dirname, 'public/stylesheets'),
        dest: path.join(__dirname, 'public/stylesheets'),
        indentedSyntax: false, // true = .sass and false = .scss
        sourceMap: false,
        debug: true,
        outputStyle: 'nested', // Optional: 'nested', 'expanded', 'compact', 'compressed'
        prefix: '/stylesheets', // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
    }),
    express.static(path.join(__dirname, 'public'))
);
// app.use(express.static(path.join(__dirname, 'public')));
// Middleware to handle language switching
app.use(i18n.init);
app.use((req, res, next) => {
    // Set default language
    let lang = req.cookies.locale || 'en'; // Use cookie if available, otherwise default to 'en'

    // Get browser/system language
    const browserLang = req.headers['accept-language']?.split(',')[0];

    // Detect language from query parameter (for language switcher)
    if (req.query.lang && i18n.getLocales().includes(req.query.lang)) {
        lang = req.query.lang;
    }
    // Fallback to browser language if supported
    else if (browserLang && i18n.getLocales().includes(browserLang)) {
        lang = browserLang;
    }

    // Set the language and store in cookie
    res.setLocale(lang);
    res.cookie('locale', lang);
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

// Routes
app.use('/modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/', indexRouter);
app.use('/about_me', aboutMeRouter);
app.use('/contact', contactRouter);
app.use('/monitor', monitorAuth, monitorRouter);
app.use('/v2ray', v2rayRouter);

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

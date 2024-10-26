// Load environment variables
require("dotenv").config();

// Core modules and third-party libraries
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require('express-session');
const csurf = require("csurf");
const sassMiddleware = require('sass-middleware');
const rateLimit = require("express-rate-limit");
const Redis = require("ioredis");
const RedisStore = require('connect-redis').default;

// Custom modules and configurations
const i18n = require("./packages/i18nConfig.js");
const sendEmail = require("./packages/email.js");

// Routes
const indexRouter = require('./routes/index');
const aboutMeRouter = require('./routes/about-me');
const contactRouter = require('./routes/contact');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const monitorRouter = require('./routes/monitor');
const v2rayRouter = require('./routes/v2ray');

// Create express app
const app = express();
app.set('trust proxy', 1);

// Set up view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Middleware: Logging and parsing
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

// Initialize Redis client
const redis = new Redis({
    port: process.env.REDIS_LOCAL_PORT,
    host: "127.0.0.1",
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD
});

// Middleware: Session handling (must come before csurf)
app.use(session({
    store: new RedisStore({client: redis}),
    secret: process.env.SECRET_KEY, // Keep your secret key secure
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true, // Helps prevent XSS attacks by disallowing JavaScript access to cookies
        sameSite: "strict", // Prevents CSRF attacks
        maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
    }
}));

// Middleware: CSRF protection (after session middleware)
app.use(csurf({
    cookie: {
        secure: process.env.NODE_ENV === "production", // Secure cookies in production
        httpOnly: true,  // Prevent JavaScript from accessing the CSRF token via JavaScript
        sameSite: "strict", // Prevent CSRF attacks
    }
}));

// Middleware: Set CSRF token for views
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Middleware: SASS compilation and static file serving
app.use(sassMiddleware({
    src: path.join(__dirname, 'public/stylesheets'),
    dest: path.join(__dirname, 'public/stylesheets'),
    indentedSyntax: false, // true = .sass, false = .scss
    sourceMap: false,
    debug: true,
    outputStyle: "nested", // Options: "nested", "expanded", "compact", "compressed"
    prefix: '/stylesheets', // Where prefix is at <link rel="stylesheet" href="prefix/style.css"/>
}));
app.use(express.static(path.join(__dirname, "public")));

// Middleware: Internationalization (i18n)
app.use(i18n.init);
app.use((req, res, next) => {
    // Set default language
    let lang = req.cookies.locale || "en"; // Use cookie if available, otherwise default to "en"

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
    res.cookie("locale", lang, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // Store for 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });

    next(); // Proceed to the next middleware
});

// Middleware: Rate limiting
app.use(rateLimit({
    windowMs: 10 * 60 * 1000, // 15 minutes
    limit: (req, res) => {
        return (req.session.isLoggedIn) ? 500 : 100; // Limit to 30 requests per 15 minutes for non-logged in users
    },
    message: "Too many requests from this IP, please try again after 15 minutes"
}));

// Global variables accessible in templates
app.locals.domain = (process.env.NODE_ENV === "production") ? process.env.DOMAIN_PROD : process.env.DOMAIN_DEV;

// Routes
app.use('/modules', express.static(path.join(__dirname, "node_modules")));
app.use('/', indexRouter);
app.use('/about-me', aboutMeRouter);
app.use('/contact', contactRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/monitor', monitorRouter);
app.use('/v2ray', v2rayRouter);

// Express route to send email
app.post('/emailing', async (req, res) => {
    // TODO debug log
    console.log('Received email request');
    const {
        name,
        fromEmail = process.env.NO_REPLY_EMAIL,
        toEmail,
        subject = `[ZiyiLiu.top] Message from ${name}`,
        message
    } = req.body;
    const emailOptions = {
        to: toEmail,
        from: fromEmail,
        subject: subject,
        message: message,

    };

    try {
        // TODO debug log
        console.log(emailOptions);
        console.log('Sending email...');
        await sendEmail(emailOptions);
        console.log('Email sent successfully');
        res.status(200).send('Email sent successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error sending email');
    }
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
    // Handle CSRF token errors
    if (err.code === "EBADCSRFTOKEN") {
        res.status(403);
        res.send("Form tampered with");
        return;
    }

    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // Render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;

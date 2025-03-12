// app.js
// Load environment variables
require("dotenv").config();

// Core Modules
const path = require("path");

// Third-Party Libraries
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const csurf = require("csurf");
const express = require("express");
const logger = require("morgan");
const session = require("express-session");
const sassMiddleware = require("sass-middleware");
const rateLimit = require("express-rate-limit");
const RedisStore = require('connect-redis').default;
const {NodeSSH} = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs-extra');
const cron = require('node-cron');

// Custom modules and configurations
const i18n = require("./packages/i18nConfig.js");
const redis = require("./packages/redisClient.js");

// Routes
const indexRouter = require('./routes/index');
const aboutMeRouter = require('./routes/about-me');
const contactRouter = require('./routes/contact');
const authRouter = require('./routes/auth');
const consoleRouter = require('./routes/console');
const adminRouter = require('./routes/admin');
const v2rayRouter = require('./routes/v2ray');
const blogRouter = require('./routes/blog');

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
        maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
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
    // 15 minutes for prod, 10s for dev (NODE_ENV=development)
    windowMs: (process.env.NODE_ENV === "production") ? 15 * 60 * 1000 : 10 * 1000,
    limit: (req, res) => {
        return (req.session.isLoggedIn) ? 500 : 100; // Limit to 30 requests per 15 minutes for non-logged in users
    },
    message: "Too many requests from this IP, please try again after 15 minutes"
}));

// Middleware to set user info if logged in
app.use((req, res, next) => {
    if (req.session.isLoggedIn) {
        res.locals.user = {
            isLoggedIn: true,
            userId: req.session.userId,
            email: req.session.email,
            username: req.session.username,
            isAdmin: req.session.isAdmin,
            isUserManager: req.session.isUserManager,
            roles: req.session.roles
        };
    } else {
        res.locals.user = {isLoggedIn: false};
    }
    next();
});

// Global variables accessible in templates
app.locals.domain = (process.env.NODE_ENV === "production") ? process.env.DOMAIN_PROD : process.env.DOMAIN_DEV;

// Routes
app.use(express.static(path.join(__dirname, "public")));
app.use('/chartjs', express.static(path.join(__dirname, 'node_modules/chart.js/dist')));
app.use(express.static(path.join(__dirname, "node_modules")));
app.use('/', indexRouter);
app.use('/about-me', aboutMeRouter);
app.use('/contact', contactRouter);
app.use('/auth', authRouter);
app.use('/console', consoleRouter);
app.use('/admin', adminRouter);
app.use('/v2ray', v2rayRouter);
app.use('/blog', blogRouter);

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

// V2ray log sync cron job
// Function to perform the sync
async function syncV2rayLogs() {
    try {
        console.log('Connecting to remote server...');
        await ssh.connect({
            host: process.env.SSH_HOST,
            username: process.env.SSH_USER,
            privateKey: process.env.SSH_PRIVATE_KEY
        });

        console.log('Starting file transfer...');

        // Ensure the local directory exists
        await fs.ensureDir(process.env.US_V2RAY_LOGS_PATH);
        // Sync logs from US server to local directory
        const resultUs = await ssh.getDirectory(
            // Local path, Remote path
            process.env.US_V2RAY_LOGS_PATH, process.env.V2RAY_LOGS_PATH, {
                recursive: true,
                concurrency: 10,
                validate: (itemPath) => true,  // Sync all files
                tick: (localFile, remoteFile, error) => {
                    if (error) {
                        console.error(`Failed to copy ${remoteFile}:`, error);
                    } else {
                        console.log(`Successfully copied ${remoteFile}`);
                    }
                }
            });

        if (resultUs) {
            console.log('File transfer complete. Setting permissions...');
            fs.chmodSync(process.env.US_V2RAY_LOGS_PATH, 0o755);
            fs.readdirSync(process.env.US_V2RAY_LOGS_PATH).forEach(file => {
                const filePath = path.join(process.env.US_V2RAY_LOGS_PATH, file);
                fs.chmodSync(filePath, 0o755);
            });

            console.log('Permissions set to 755 for all files and directories.');
        } else {
            console.error('File transfer failed.');
        }

        // copy paste local path and remote path: V2RAY_LOGS_PATH -> DE_V2RAY_LOGS_PATH, no ssh is needed
        await fs.ensureDir(process.env.DE_V2RAY_LOGS_PATH);
        const resultDe = await fs.copy(process.env.V2RAY_LOGS_PATH, process.env.DE_V2RAY_LOGS_PATH);

        if (resultDe) {
            console.log('File transfer complete. Setting permissions...');
            fs.chmodSync(process.env.DE_V2RAY_LOGS_PATH, 0o755);
            fs.readdirSync(process.env.DE_V2RAY_LOGS_PATH).forEach(file => {
                const filePath = path.join(process.env.DE_V2RAY_LOGS_PATH, file);
                fs.chmodSync(filePath, 0o755);
            });

            console.log('Permissions set to 755 for all files and directories.');
        } else {
            console.error('File transfer failed.');
        }
    } catch (error) {
        console.error('Error during log sync:', error);
    } finally {
        ssh.dispose();
    }
}

// Schedule cron job to run at 01:00 UTC daily
cron.schedule('0 1 * * *', () => {
    console.log('Running daily sync for V2Ray logs...');
    syncV2rayLogs().then(r => console.debug('Sync complete'));
});

// Express route to trigger manual sync
app.get('/sync-logs', async (req, res) => {
    await syncV2rayLogs();
    res.send('Manual sync initiated');
});

// Set sitemap and robots.txt
app.get('/sitemap.xml', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'))
);

app.get('/robots.txt', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'))
);


module.exports = app;


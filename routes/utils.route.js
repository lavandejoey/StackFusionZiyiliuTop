// routes/utils.js
function getCommonViewOptions(req, res,
                              pageTitle = "Ziyi Liu",
                              pageDescription = "Ziyi Liu's Personal Website") {
    console.log("Current locale:", req.getLocale());
    return {
        lang: req.getLocale() || 'en',
        pageTitle: pageTitle,
        pageDescription: pageDescription,
    };
}

function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function updateSession(req, user) {
    req.session.isLoggedIn = true;
    req.session.userId = user.uuid;
    req.session.email = user.email;
    req.session.username = user.first_name;
    req.session.firstName = user.first_name;
    req.session.lastName = user.last_name;
    req.session.isAdmin = user.isAdmin();
    req.session.isUserManager = user.isUserManager();
    req.session.isLocked = user.isLocked();
    req.session.roles = user.roles;

    // Set session expiry
    req.session.cookie.expires = new Date(Date.now() + 3600000);  // 1 hour

    // Save session
    req.session.save((err) => {
        if (err) {
            console.error("Error saving session:", err);
        }
    });
}

module.exports = {
    getCommonViewOptions,
    regenerateSession,
    updateSession,
};
// Contact routes

// Require express and create a router
const express = require("express");
const router = express.Router();
const {sendEmail} = require("../packages/postmark");

// GET contact page
router.get('/', function (req, res, next) {
    res.render("contact", {
        lang: req.getLocale(),
        activePage: "Contact",
        pageTitle: res.__("Contact Me"),
        csrfToken: req.csrfToken()
    });
});


// Processing form data
router.post('/', async (req, res) => {
    const {
        surname,
        firstName,
        email: toEmail,
        message
    } = req.body;
    console.log("Request body: ", req.body);
    const emailOptions = {
        to: toEmail,
        from: process.env.NO_REPLY_EMAIL,
        subject: `[ZiyiLiu.top] Message from ${surname}, ${firstName}`,
        message: message,
    };
    // console.log(emailOptions);
    try {
        // console.log('Sending email...');
        await sendEmail(emailOptions);
        // console.log('Email sent successfully');
        res.status(200).send('Email sent successfully');
    } catch (error) {
        // console.error(error);
        res.status(500).send('Error sending email');
    }

    // redirect to contact page
    res.redirect('/');
});

module.exports = router;
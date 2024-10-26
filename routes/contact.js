// Contact routes

// Require express and create a router
const express = require("express");
const sendEmail = require("../packages/email");
const router = express.Router();

// GET contact page
router.get('/', function (req, res, next) {
    res.render("contact", {
        lang: req.getLocale(),
        activePage: "Contact",
        pageTitle: res.__("Contact Me"),
        domain: req.app.locals.domain,
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
    console.log(emailOptions);
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

    // try {
    //     // Request domain/emailing route
    //     // TODO debug log
    //     console.log('Requesting email sending at ', `${req.app.locals.domain}emailing`);
    //     const response = await fetch(`${req.app.locals.domain}emailing`, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'CSRF-Token': req.csrfToken()
    //         },
    //         body: JSON.stringify({
    //             name: `${surname}, ${firstName}`,
    //             toEmail: email,
    //             message: message,
    //             _csrf: req.csrfToken()
    //         })
    //     });
    //     if (response.ok) {
    //         // TODO debug log
    //         console.log('Email sent successfully');
    //         res.status(200).send('Email sent successfully');
    //     } else {
    //         // TODO debug log
    //         console.error('Error sending email');
    //         res.status(500).send('Error sending email');
    //         // response code and error message
    //         console.error(response.status, response.statusText);
    //     }
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).send('Error requesting email sending');
    // }
});

module.exports = router;
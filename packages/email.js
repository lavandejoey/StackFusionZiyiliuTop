const nodemailer = require('nodemailer');

const sendEmail = async ({ to, from, subject, message }) => {
    try {
        let transporter = nodemailer.createTransport({
            // GMail SMTP server
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: 'your_password', // SMTP password
            },
        });

        let info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            text: message,
        });

        console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Test code to send an email TODO
const emailOptions = {
    to: 'lavandejoey@outlook.com',
    from: 'sender@example.com',
    subject: 'Test Email',
    message: 'This is a test email sent from the SMTP client.',
}
try {
    sendEmail(emailOptions);
} catch (error) {
    console.error(error);
}
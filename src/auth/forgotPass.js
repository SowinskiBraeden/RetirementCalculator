const express = require('express');
const crypto = require('crypto');
const nodeMail = require('nodemailer');
require('dotenv').config();

const transporter = nodeMail.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.PASS,
    }
});
// users info
module.exports = (users) => {
    const router = express.Router();

    router.post('/resetPass', async (req, res) => {
        const { email } = req.body;
        const user = await users.findOne({ email });

        if (!user) {
            req.session.error = 'No user found'
            return res.redirect('/forgotPassword');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiration = Date.now() + 360000;

        await users.updateOne({ email }, {
            $set: { resetToken: token, resetTokenExpires: expiration }
        });

        const resetUrl = `http://localhost:3000/reset/${token}`;

        const mailSend = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password reset',
            text: `reset your password here ${resetUrl} \n this link will expire within 1 hour`,

        };

        try {
            await transporter.sendMail(mailSend);
            req.session.reset = 'Reset link sent Check your email';
            res.redirect('/login');
        } catch (err) {
            console.log('there was an error', err);
            res.status(500).send('email failed to send try again');
        }
    });
    return router;
}

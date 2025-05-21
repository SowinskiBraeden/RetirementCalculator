const { passwordStrength } = require("check-password-strength");
const nodeMail = require('nodemailer');
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const joi = require('joi');
require('dotenv').config();

const PORT = process.env.PORT;

const transporter = nodeMail.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

module.exports = (users) => {
    const router = express.Router();

    router.post('/auth/resetPass', async (req, res) => {
        const resetSchema = joi.object({
            email: joi.string().email({ minDomainSegments: 2, tlds: { allow: true } }).required(),
        });
        req.session.error = '';
        req.session.reset = '';

        const valid = resetSchema.validate(req.body);
        if (valid.error) {
            req.session.error = 'invalid email';
            return res.redirect('/forgotPassword')
        }
        const { email } = req.body;
        const user = await users.findOne({ email });

        if (!user) {
            req.session.error = 'No user found'
            return res.redirect('/forgotPassword');
        }

        const token = crypto.randomBytes(32).toString('hex');
        console.log(`The reset token is ${token}`)
        const expiration = Date.now() + 3600000;

        await users.updateOne({ email }, {
            $set: { resetToken: token, resetTokenExpires: expiration }
        });

        const resetUrl = `http://localhost:${PORT}/reset/${token}`;

        const mailSend = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password reset',
            text: `Hi ${user.name},\nA request was sent to reset your password. If this wasn't you, please ignore this email.\nIf you sent the request, reset your password here ${resetUrl}   this link will expire within 1 hour, \n Do not share this link with anyone.
                \n \n Thankyou, The RCalculator team.`,
                html: `
                <p>Hi ${user.name}</p>
                <p>A request was sent to reset your password. <strong>If this wasn't you, please ignore this email.</strong></p>
                <p>If you sent the request, reset your password <a href="${resetUrl}">here</a>. This link will expire in 1 hour.</p>
                <p><img src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/rekor.png" alt="wallet icon" width="150"/></p>
                <p>Thank you,<br/>The RCalculator team</p>`,
        };

        try {
            await transporter.sendMail(mailSend);
            req.session.reset = 'Reset link sent Check your email';
            res.redirect('/forgotPassword');
        } catch (err) {
            console.log('there was an error', err);
            res.status(500).send('email failed to send try again');
        }
    });

    //Reset link verifies information from user and checks token
    router.post('/resetLink', async (req, res) => {
        const { token, password, confirmPassword, } = req.body;
        const passwordSchema = joi.object({
            password: joi.string().max(20).required(),
            confirmPassword: joi.string().max(20).required(),
        });
        const valid = passwordSchema.validate({ password, confirmPassword });
        if (valid.error) {
            console.log("houston we have a problem"); // nice
            req.session.error = "Invalid input:" + valid.error.details.map(d => d.message.replace(/"/g, '')).join(', ');;
            res.status(status.BadRequest);
            return res.redirect(`/reset/${token}`);
        }
        if (!token || !password || !confirmPassword) {
            req.session.error = 'field may be missing';
            return res.redirect(`/reset/${token}`);
        }
        if (password !== confirmPassword) {
            req.session.error = 'passwords do not match';
            return res.redirect(`/reset/${token}`);
        }
        const user = await users.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            req.session.error = 'Reset link is invalid.';
            return res.redirect(`/reset`);
        }

        let strength = passwordStrength(password);
        if (strength.id < 2) {
            req.session.errMessage = `Password ${strength.value}`;
            return res.redirect(`/reset/${token}`);
        }

        const hashPassword = await bcrypt.hash(password, 12);

        await users.updateOne(
            {
                email: user.email
            },
            {
                $set: {
                    password: hashPassword,
                    resetToken: '',
                    resetTokenExpires: 0,
                },
            }
        );
        req.session.success = 'Password has been reset';
        res.redirect('/login');
    });

    return router;
}


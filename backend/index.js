const express = require("express");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Email sending route
app.post("/send-email", async (req, res) => {
    const { recipients, subject, message } = req.body;
    
    if (!recipients || !subject || !message) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail
            pass: process.env.EMAIL_PASS  // App password
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipients.join(","), // Convert array to comma-separated string
        subject,
        text: message
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Emails sent successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error sending emails", error });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 1000;

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
// More specific CORS configuration
// CORS configuration - place this before defining any routes
app.use(cors({
    origin: ['https://automate-sx3v.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'], // Add OPTIONS for preflight requests
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  
  // Then handle preflight requests explicitly
  app.options('*', cors());

app.use(express.json());

// Email sending route with file upload
app.post('/send-email', upload.single('image'), async (req, res) => {
    const { recipients, subject, message, tagline } = req.body;
    
    if (!recipients || !subject || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Create HTML email template
    const htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="text-align: center; padding: 20px;">
                <h1 style="color: #2d3748; margin-bottom: 20px;">${tagline || 'Welcome'}</h1>
                ${req.file ? `<img src="cid:attached-image" style="max-width: 100%; height: auto; margin-bottom: 20px;">` : ''}
                <div style="color: #4a5568; line-height: 1.6;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>
    `;

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipients.split(',').map(email => email.trim()).join(','),
        subject,
        html: htmlContent
    };

    // If there's an image, attach it
    if (req.file) {
        mailOptions.attachments = [{
            filename: 'image.jpg',
            content: req.file.buffer,
            cid: 'attached-image'
        }];
    }

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Emails sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending emails', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
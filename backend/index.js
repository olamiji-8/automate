const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { Readable } = require('stream');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 1000;

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// CORS configuration - place this before defining any routes
app.use(cors({
  origin: ['https://automate-sx3v.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'], // Add OPTIONS for preflight requests
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());

// Helper function to parse CSV data from buffer
function parseCsvBuffer(buffer) {
  const results = [];
  return new Promise((resolve, reject) => {
    const stream = Readable.from(buffer.toString('utf8'));
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

// Helper function to parse Excel data from buffer
function parseExcelBuffer(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
}

// Endpoint to upload and process recipient list
app.post('/upload-recipients', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let recipients = [];
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (fileExtension === '.csv') {
      recipients = await parseCsvBuffer(req.file.buffer);
    } else if (['.xlsx', '.xls'].includes(fileExtension)) {
      recipients = parseExcelBuffer(req.file.buffer);
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Please upload a CSV or Excel file.' });
    }

    // Validate that the file has the required columns
    if (recipients.length > 0) {
      const firstRecipient = recipients[0];
      if (!firstRecipient.email && !firstRecipient.Email) {
        return res.status(400).json({ message: 'File must contain an "email" or "Email" column' });
      }
    }

    res.status(200).json({ 
      message: 'Recipients processed successfully', 
      count: recipients.length,
      preview: recipients.slice(0, 5) // Send first 5 entries as preview
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ message: 'Error processing file', error: error.message });
  }
});

// Enhanced email sending route with personalization support
app.post('/send-bulk-email', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'recipientFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { subject, message, tagline, template } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    // Process recipients file if uploaded
    let recipients = [];
    if (req.files.recipientFile && req.files.recipientFile[0]) {
      const file = req.files.recipientFile[0];
      const fileExtension = path.extname(file.originalname).toLowerCase();

      if (fileExtension === '.csv') {
        recipients = await parseCsvBuffer(file.buffer);
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        recipients = parseExcelBuffer(file.buffer);
      } else {
        return res.status(400).json({ message: 'Unsupported recipient file format' });
      }
    } else if (req.body.recipients) {
      // Handle comma-separated email list
      recipients = req.body.recipients.split(',').map(email => ({ email: email.trim() }));
    } else {
      return res.status(400).json({ message: 'No recipients provided' });
    }

    // Set up email transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Track success and failures
    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    // Send personalized emails to each recipient
    for (const recipient of recipients) {
      try {
        // Normalize email field (could be 'email' or 'Email')
        const email = recipient.email || recipient.Email;
        if (!email) {
          results.failed++;
          results.errors.push({ recipient, error: 'No email address found' });
          continue;
        }

        // Personalize the message by replacing placeholders
        let personalizedMessage = message;
        let personalizedSubject = subject;
        
        // Replace placeholders with recipient data
        Object.keys(recipient).forEach(key => {
          const placeholder = new RegExp(`{{${key}}}`, 'gi');
          personalizedMessage = personalizedMessage.replace(placeholder, recipient[key] || '');
          personalizedSubject = personalizedSubject.replace(placeholder, recipient[key] || '');
        });

        // Create HTML email content
        const htmlContent = `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <div style="text-align: center; padding: 20px;">
                  <h1 style="color: #2d3748; margin-bottom: 20px;">${tagline || 'Welcome'}</h1>
                  ${req.files.image ? `<img src="cid:attached-image" style="max-width: 100%; height: auto; margin-bottom: 20px;">` : ''}
                  <div style="color: #4a5568; line-height: 1.6;">
                      ${personalizedMessage.replace(/\n/g, '<br>')}
                  </div>
              </div>
          </div>
        `;

        let mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: personalizedSubject,
          html: htmlContent
        };

        // If there's an image, attach it
        if (req.files.image && req.files.image[0]) {
          mailOptions.attachments = [{
            filename: 'image.jpg',
            content: req.files.image[0].buffer,
            cid: 'attached-image'
          }];
        }

        // Send the email
        await transporter.sendMail(mailOptions);
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({ 
          recipient: recipient.email || recipient.Email, 
          error: error.message 
        });
      }
    }

    res.status(200).json({ 
      message: `Completed sending emails: ${results.sent} sent, ${results.failed} failed`, 
      results 
    });
  } catch (error) {
    console.error('Error in bulk email process:', error);
    res.status(500).json({ message: 'Error processing bulk email', error: error.message });
  }
});

// Keep the original single email endpoint
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

// Endpoint to get a list of templates (can be expanded later)
app.get('/email-templates', (req, res) => {
  const templates = [
    {
      id: 'default',
      name: 'Default Template',
      description: 'A simple clean template for general purposes'
    },
    {
      id: 'promotional',
      name: 'Promotional',
      description: 'Template optimized for marketing and promotions'
    }
  ];
  
  res.status(200).json({ templates });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
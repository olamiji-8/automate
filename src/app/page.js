import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';

const EmailMarketing = () => {
  const [formData, setFormData] = useState({
    recipients: '',
    subject: '',
    message: '',
    tagline: 'One Stop Shop For Everything At Your Convenience',
    imageFile: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [status, setStatus] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendEmails = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append('recipients', formData.recipients);
    formDataToSend.append('subject', formData.subject);
    formDataToSend.append('message', formData.message);
    formDataToSend.append('tagline', formData.tagline);
    if (formData.imageFile) {
      formDataToSend.append('image', formData.imageFile);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/send-email`, {
        method: 'POST',
        body: formDataToSend,
      });
      const data = await response.json();
      setStatus(data.message);
    } catch (error) {
      setStatus('Error sending emails');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-green-600">Email</span> Marketing System
            </h1>
            <Input
              type="text"
              placeholder="Your Business Tagline"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="text-center font-semibold mb-4"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview Card */}
          <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Email Preview</h3>
            <div className="text-center p-4 border rounded">
              <p className="text-lg font-medium mb-4">{formData.tagline}</p>
              {previewImage && (
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="max-w-full h-auto mb-4 mx-auto"
                />
              )}
              <p className="text-gray-600">{formData.message}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recipients (comma-separated)</label>
              <Input
                type="text"
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter email subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter your message"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Upload Image</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <Button 
                  onClick={() => document.getElementById('image-upload').click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
              </div>
            </div>

            <Button 
              onClick={sendEmails}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Send Emails
            </Button>

            {status && (
              <div className={`text-center p-2 rounded ${
                status.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {status}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailMarketing;
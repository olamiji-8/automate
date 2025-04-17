'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileUp, Send, FilePlus, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EmailMarketing = () => {
  const [formData, setFormData] = useState({
    recipients: '',
    subject: '',
    message: '',
    tagline: 'One Stop Shop For Everything At Your Convenience',
    imageFile: null
  });
  
  const [bulkEmailData, setBulkEmailData] = useState({
    subject: '',
    message: '',
    tagline: 'One Stop Shop For Everything At Your Convenience',
    imageFile: null,
    recipientFile: null
  });
  
  const [previewImage, setPreviewImage] = useState(null);
  const [bulkPreviewImage, setBulkPreviewImage] = useState(null);
  const [status, setStatus] = useState(null);
  const [bulkStatus, setBulkStatus] = useState(null);
  const [recipientsPreview, setRecipientsPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Handle image change for single emails
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
  
  // Handle image change for bulk emails
  const handleBulkImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBulkEmailData({ ...bulkEmailData, imageFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setBulkPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle recipient file upload
  const handleRecipientFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setBulkEmailData({ ...bulkEmailData, recipientFile: file });
      
      // Upload file to get preview data
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      
      try {
        setBulkStatus('Loading recipient data...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload-recipients`, {
          method: 'POST',
          body: formDataToSend,
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setRecipientsPreview(data.preview || []);
          setBulkStatus(`Successfully loaded ${data.count} recipients`);
        } else {
          setBulkStatus(`Error: ${data.message}`);
        }
      } catch (error) {
        setBulkStatus('Error processing recipient file');
        console.error(error);
      }
    }
  };
  
  // Send single emails
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
      setStatus('Sending emails...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/send-email`, {
        method: 'POST',
        body: formDataToSend,
      });
      const data = await response.json();
      setStatus(data.message);
    } catch (error) {
      setStatus('Error sending emails');
      console.error(error);
    }
  };
  
  // Send bulk emails
  const sendBulkEmails = async () => {
    if (!bulkEmailData.recipientFile) {
      setBulkStatus('Please upload a recipient file');
      return;
    }
    
    const formDataToSend = new FormData();
    formDataToSend.append('subject', bulkEmailData.subject);
    formDataToSend.append('message', bulkEmailData.message);
    formDataToSend.append('tagline', bulkEmailData.tagline);
    if (bulkEmailData.imageFile) {
      formDataToSend.append('image', bulkEmailData.imageFile);
    }
    formDataToSend.append('recipientFile', bulkEmailData.recipientFile);

    try {
      setBulkStatus('Sending bulk emails...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/send-bulk-email`, {
        method: 'POST',
        body: formDataToSend,
      });
      const data = await response.json();
      setBulkStatus(data.message);
    } catch (error) {
      setBulkStatus('Error sending bulk emails');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-green-600">Email</span> Marketing System
            </h1>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="single">Single Email</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Email</TabsTrigger>
            </TabsList>
            
            {/* Single Email Tab */}
            <TabsContent value="single">
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Your Business Tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="text-center font-semibold mb-4"
                />
                
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
                    <Send className="w-4 h-4 mr-2" />
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
              </div>
            </TabsContent>
            
            {/* Bulk Email Tab */}
            <TabsContent value="bulk">
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Your Business Tagline"
                  value={bulkEmailData.tagline}
                  onChange={(e) => setBulkEmailData({ ...bulkEmailData, tagline: e.target.value })}
                  className="text-center font-semibold mb-4"
                />
                
                {/* Preview Card */}
                <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-green-600">Email Preview</h3>
                    {recipientsPreview.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {showPreview ? "Hide Recipients" : "Show Recipients"}
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-center p-4 border rounded">
                    <p className="text-lg font-medium mb-4">{bulkEmailData.tagline}</p>
                    {bulkPreviewImage && (
                      <img 
                        src={bulkPreviewImage} 
                        alt="Preview" 
                        className="max-w-full h-auto mb-4 mx-auto"
                      />
                    )}
                    <p className="text-gray-600">{bulkEmailData.message}</p>
                  </div>
                  
                  {showPreview && recipientsPreview.length > 0 && (
                    <div className="mt-4 p-4 border rounded bg-gray-50">
                      <h4 className="font-medium mb-2">Recipients Preview</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              {Object.keys(recipientsPreview[0]).map((header) => (
                                <th 
                                  key={header}
                                  className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recipientsPreview.map((recipient, index) => (
                              <tr key={index}>
                                {Object.values(recipient).map((value, valueIndex) => (
                                  <td 
                                    key={valueIndex}
                                    className="px-2 py-2 whitespace-nowrap text-sm text-gray-500"
                                  >
                                    {value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Help Text */}
                <Alert className="bg-blue-50 text-blue-700 mb-4">
                  <AlertDescription>
                    <p className="text-sm">
                      You can use placeholders like <strong>{"{{name}}"}</strong>, <strong>{"{{email}}"}</strong> in your message. 
                      These will be replaced with data from your CSV/Excel file.
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Upload Recipients (CSV or Excel)</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleRecipientFileUpload}
                        className="hidden"
                        id="recipient-upload"
                      />
                      <Button 
                        onClick={() => document.getElementById('recipient-upload').click()}
                        className="w-full"
                      >
                        <FilePlus className="w-4 h-4 mr-2" />
                        {bulkEmailData.recipientFile ? 'Change File' : 'Upload Recipients File'}
                      </Button>
                    </div>
                    {bulkEmailData.recipientFile && (
                      <p className="text-sm text-gray-500 mt-1">
                        File: {bulkEmailData.recipientFile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    <Input
                      type="text"
                      value={bulkEmailData.subject}
                      onChange={(e) => setBulkEmailData({ ...bulkEmailData, subject: e.target.value })}
                      placeholder="Enter email subject (can use placeholders like {{name}})"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <Textarea
                      value={bulkEmailData.message}
                      onChange={(e) => setBulkEmailData({ ...bulkEmailData, message: e.target.value })}
                      placeholder="Enter your message with placeholders (e.g., Hello {{name}}!)"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Upload Image</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleBulkImageChange}
                        className="hidden"
                        id="bulk-image-upload"
                      />
                      <Button 
                        onClick={() => document.getElementById('bulk-image-upload').click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={sendBulkEmails}
                    disabled={!bulkEmailData.recipientFile}
                    className={`w-full ${
                      bulkEmailData.recipientFile 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    Send Bulk Emails
                  </Button>

                  {bulkStatus && (
                    <div className={`text-center p-2 rounded ${
                      bulkStatus.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {bulkStatus}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailMarketing;
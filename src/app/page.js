
'use client'
import { useState } from "react";

export default function Home() {
    const [recipients, setRecipients] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState(null);

    const sendEmails = async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipients: recipients.split(",").map(email => email.trim()),
                subject,
                message
            })
        });

        const data = await response.json();
        setStatus(data.message);
    };

    return (
        <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center" }}>
            <h2>Send Bulk Emails</h2>
            <input type="text" placeholder="Recipient emails (comma-separated)" 
                value={recipients} onChange={(e) => setRecipients(e.target.value)}
                style={{ width: "100%", marginBottom: "10px", padding: "10px" }} />
            <input type="text" placeholder="Subject" value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                style={{ width: "100%", marginBottom: "10px", padding: "10px" }} />
            <textarea placeholder="Message" value={message} 
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: "100%", height: "100px", marginBottom: "10px", padding: "10px" }} />
            <button onClick={sendEmails} style={{ padding: "10px 20px", cursor: "pointer" }}>Send Emails</button>
            {status && <p>{status}</p>}
        </div>
    );
}

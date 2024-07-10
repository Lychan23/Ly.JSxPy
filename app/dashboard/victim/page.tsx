"use client";
import React, { useState } from 'react';

const VictimPage = () => {
  const [messageInput, setMessageInput] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sendMessageToDiscord = async () => {
    try {
      await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageInput }),
      });
      setLog([...log, `> ${messageInput}`, 'Message sent to Discord']);
      setMessageInput('');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to send message to Discord: ${error.message}`);
      } else {
        setError("Failed to send message to Discord");
      }
      setLog([...log, `> ${messageInput}`, 'Error sending message to Discord']);
    }
  };

  return (
    <div>
      <h1>Victim Control Panel</h1>
      <div>
        <h2>Terminal</h2>
        <div style={{ border: '1px solid black', padding: '10px', height: '300px', overflowY: 'scroll' }}>
          {log.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessageToDiscord()}
          placeholder="Enter message"
          style={{ width: '100%', padding: '10px', marginTop: '10px' }}
        />
        <button onClick={sendMessageToDiscord} style={{ width: '100%', padding: '10px', marginTop: '10px' }}>
          Send Message to Discord
        </button>
      </div>
      {error && (
        <div style={{ color: 'red' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default VictimPage;

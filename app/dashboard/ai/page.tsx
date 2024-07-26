// file path: app/dashboard/ai/page.tsx
"use client"
import React, { useState } from 'react';

const AIDashboard: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [serverStatus, setServerStatus] = useState('stopped');

    const handleServerControl = async (action: string) => {
        const res = await fetch(`/api/ai?action=${action}`);
        const data = await res.json();
        if (res.ok) {
            setServerStatus(action === 'start' ? 'running' : 'stopped');
        }
        alert(data.message);
    };

    const handlePromptSubmit = async () => {
        const res = await fetch('http://localhost:4500/ai_prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (res.ok) {
            setResponse(data.response);
        } else {
            alert(data.error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-backgroundStart to-backgroundEnd flex flex-col items-center py-10">
            <h1 className="text-4xl font-bold mb-8">AI Dashboard</h1>
            <div className="control-panel p-6 rounded-lg shadow-lg mb-8">
                <div className="mb-4">
                    <button className="btn mr-4" onClick={() => handleServerControl('start')}>Start Server</button>
                    <button className="btn" onClick={() => handleServerControl('stop')}>Stop Server</button>
                </div>
                <p>Server status: <span className="font-semibold">{serverStatus}</span></p>
            </div>
            <div className="control-panel p-6 rounded-lg shadow-lg mb-8">
                <div className="mb-4">
                    <input 
                        type="text" 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)} 
                        placeholder="Enter your prompt" 
                        className="input w-full p-2 rounded mb-4"
                    />
                    <button className="btn w-full" onClick={handlePromptSubmit}>Send Prompt</button>
                </div>
            </div>
            {response && (
                <div className="response-panel p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Response</h2>
                    <p>{response}</p>
                </div>
            )}
        </div>
    );
};

export default AIDashboard;

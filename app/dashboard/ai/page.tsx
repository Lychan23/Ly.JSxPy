<<<<<<< HEAD
// pages/ai.tsx

"use client"
import { useState, ChangeEvent, FormEvent } from 'react';

export default function AIPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [error, setError] = useState<string>('');
    const [feedback, setFeedback] = useState<{ [key: number]: number }>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);

        try {
            const res = await fetch('/api/webscrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input }),
            });

            if (!res.ok) {
                throw new Error(`Error: ${res.statusText}`);
            }

            const data = await res.json();
            const botMessage = { role: 'bot', content: `Title: ${data.best_result.title}\nDescription: ${data.best_result.description}` };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            if (error instanceof Error) {
                setError(`Failed to fetch: ${error.message}`);
            } else {
                setError('An unknown error occurred');
            }
        }

        setInput('');
    };

    const handleFeedback = async (index: number, feedbackValue: number) => {
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ feedback: feedbackValue }),
            });

            if (!res.ok) {
                throw new Error(`Error: ${res.statusText}`);
            }

            setFeedback(prev => ({ ...prev, [index]: feedbackValue }));
        } catch (error) {
            if (error instanceof Error) {
                setError(`Failed to send feedback: ${error.message}`);
            } else {
                setError('An unknown error occurred');
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-6">
            <div className="flex flex-col w-full max-w-3xl bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-4">AI Web Scraper</h1>
                <div className="flex flex-col space-y-4 mb-4 overflow-y-auto">
                    {messages.map((message, index) => (
                        <div key={index} className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-gray-800 self-start'}`}>
                            {message.content}
                            {message.role === 'bot' && (
                                <div className="flex space-x-2 mt-2">
                                    <button
                                        className={`px-2 py-1 rounded ${feedback[index] === 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                                        onClick={() => handleFeedback(index, 1)}
                                    >
                                        👍
                                    </button>
                                    <button
                                        className={`px-2 py-1 rounded ${feedback[index] === -1 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                                        onClick={() => handleFeedback(index, -1)}
                                    >
                                        👎
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                        placeholder="Enter your prompt"
                        className="flex-1 p-2 border rounded-lg"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">Send</button>
                </form>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
    );
}
=======
// pages/ai.tsx

"use client"
import { useState, ChangeEvent, FormEvent } from 'react';

export default function AIPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [error, setError] = useState<string>('');
    const [feedback, setFeedback] = useState<{ [key: number]: number }>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);

        try {
            const res = await fetch('/api/webscrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input }),
            });

            if (!res.ok) {
                throw new Error(`Error: ${res.statusText}`);
            }

            const data = await res.json();
            const botMessage = { role: 'bot', content: `Title: ${data.best_result.title}\nDescription: ${data.best_result.description}` };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            if (error instanceof Error) {
                setError(`Failed to fetch: ${error.message}`);
            } else {
                setError('An unknown error occurred');
            }
        }

        setInput('');
    };

    const handleFeedback = async (index: number, feedbackValue: number) => {
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ feedback: feedbackValue }),
            });

            if (!res.ok) {
                throw new Error(`Error: ${res.statusText}`);
            }

            setFeedback(prev => ({ ...prev, [index]: feedbackValue }));
        } catch (error) {
            if (error instanceof Error) {
                setError(`Failed to send feedback: ${error.message}`);
            } else {
                setError('An unknown error occurred');
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-6">
            <div className="flex flex-col w-full max-w-3xl bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-4">AI Web Scraper</h1>
                <div className="flex flex-col space-y-4 mb-4 overflow-y-auto">
                    {messages.map((message, index) => (
                        <div key={index} className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-gray-800 self-start'}`}>
                            {message.content}
                            {message.role === 'bot' && (
                                <div className="flex space-x-2 mt-2">
                                    <button
                                        className={`px-2 py-1 rounded ${feedback[index] === 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                                        onClick={() => handleFeedback(index, 1)}
                                    >
                                        👍
                                    </button>
                                    <button
                                        className={`px-2 py-1 rounded ${feedback[index] === -1 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                                        onClick={() => handleFeedback(index, -1)}
                                    >
                                        👎
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                        placeholder="Enter your prompt"
                        className="flex-1 p-2 border rounded-lg"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">Send</button>
                </form>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
    );
}
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e

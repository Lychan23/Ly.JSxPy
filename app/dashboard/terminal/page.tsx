<<<<<<< HEAD
"use client";
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const TerminalPage = () => {
  const [messageInput, setMessageInput] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const socket = io();
    setSocket(socket);

    socket.on('log', (message: string) => {
      setLog(prevLog => [...prevLog, message]);
    });

    socket.on('message', (message: string) => {
      setLog(prevLog => [...prevLog, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const executeCommand = async () => {
    const [command, ...args] = messageInput.split(' ');
    let apiUrl = '';
    let commandArgs = '';

    if (command === 'start') {
      apiUrl = '/api/start';
      commandArgs = args[0]; // 'local' or 'docker'
    } else if (command === 'stop') {
      apiUrl = '/api/stop';
    } else if (command === 'help') {
      try {
        const response = await fetch('/api/commands');
        const commands = await response.json();
        setLog([...log, `> ${messageInput}`, ...Object.entries(commands).map(([cmd, desc]) => `${cmd}: ${desc}`)]);
        setMessageInput('');
        return;
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(`Failed to fetch command help: ${error.message}`);
        } else {
          setError('Failed to fetch command help');
        }
        setLog([...log, `> ${messageInput}`, 'Error fetching command help']);
        setMessageInput('');
        return;
      }
    } else {
      setLog([...log, `> ${messageInput}`, 'Unknown command']);
      setMessageInput('');
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commandArgs }),
      });
      const result = await response.json();
      setLog([...log, `> ${messageInput}`, result.message]);
      setMessageInput('');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to execute command: ${error.message}`);
      } else {
        setError('Failed to execute command');
      }
      setLog([...log, `> ${messageInput}`, 'Error executing command']);
    }
  };

  return (
    <div>
      <h1>Terminal Control Panel</h1>
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
          onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
          placeholder="Enter command"
          style={{ width: '100%', padding: '10px', marginTop: '10px' }}
        />
      </div>
      {error && (
        <div style={{ color: 'red' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default TerminalPage;
=======
"use client";
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const TerminalPage = () => {
  const [messageInput, setMessageInput] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const socket = io();
    setSocket(socket);

    socket.on('log', (message: string) => {
      setLog(prevLog => [...prevLog, message]);
    });

    socket.on('message', (message: string) => {
      setLog(prevLog => [...prevLog, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const executeCommand = async () => {
    const [command, ...args] = messageInput.split(' ');
    let apiUrl = '';
    let commandArgs = '';

    if (command === 'start') {
      apiUrl = '/api/start';
      commandArgs = args[0]; // 'local' or 'docker'
    } else if (command === 'stop') {
      apiUrl = '/api/stop';
    } else if (command === 'help') {
      try {
        const response = await fetch('/api/commands');
        const commands = await response.json();
        setLog([...log, `> ${messageInput}`, ...Object.entries(commands).map(([cmd, desc]) => `${cmd}: ${desc}`)]);
        setMessageInput('');
        return;
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(`Failed to fetch command help: ${error.message}`);
        } else {
          setError('Failed to fetch command help');
        }
        setLog([...log, `> ${messageInput}`, 'Error fetching command help']);
        setMessageInput('');
        return;
      }
    } else {
      setLog([...log, `> ${messageInput}`, 'Unknown command']);
      setMessageInput('');
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commandArgs }),
      });
      const result = await response.json();
      setLog([...log, `> ${messageInput}`, result.message]);
      setMessageInput('');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to execute command: ${error.message}`);
      } else {
        setError('Failed to execute command');
      }
      setLog([...log, `> ${messageInput}`, 'Error executing command']);
    }
  };

  return (
    <div>
      <h1>Terminal Control Panel</h1>
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
          onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
          placeholder="Enter command"
          style={{ width: '100%', padding: '10px', marginTop: '10px' }}
        />
      </div>
      {error && (
        <div style={{ color: 'red' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default TerminalPage;
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e

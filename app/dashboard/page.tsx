// app/dashboard/page.tsx
"use client";
import React, { useState } from 'react';
import ControlPanel from './control-panel/page';
import CommandBuilder from './command-builder/page';
import VictimPage from './victim/page';
import { useAuth } from '../context/authContext';

const DashboardPage: React.FC = () => {
  const authContext = useAuth();

  if (!authContext?.loggedIn) {
    return <div>Please log in to access the dashboard.</div>;
  }

  const [activeComponent, setActiveComponent] = useState<'ControlPanel' | 'CommandBuilder' | 'VictimPage'>('ControlPanel');

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '200px', background: '#f0f0f0', padding: '10px' }}>
        <div style={{ marginBottom: '20px' }}>
          Welcome, {authContext.username}!
        </div>
        <button onClick={() => setActiveComponent('ControlPanel')} style={buttonStyle}>Control Panel</button>
        <button onClick={() => setActiveComponent('CommandBuilder')} style={buttonStyle}>Command Builder</button>
        <button onClick={() => setActiveComponent('VictimPage')} style={buttonStyle}>Victim Page</button>
      </div>
      <div style={{ flex: 1, padding: '20px' }}>
        {activeComponent === 'ControlPanel' && <ControlPanel />}
        {activeComponent === 'CommandBuilder' && <CommandBuilder />}
        {activeComponent === 'VictimPage' && <VictimPage />}
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  border: 'none',
  background: '#007bff',
  color: 'white',
  cursor: 'pointer',
};

export default DashboardPage;
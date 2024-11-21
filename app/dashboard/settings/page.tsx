"use client"
import QRCodeComponent from 'qrcode.react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/authContext';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Bell, Moon, Globe, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { authenticator } from 'otplib';  // Import otplib for TOTP
import type { UserSettings } from '@/types/auth';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const username = user?.username;

  const [settings, setSettings] = useState<UserSettings>({
    darkMode: false,
    notifications: true,
    language: 'en',
    twoFactorAuth: false,
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // MFA states
  const [showMfaInstructions, setShowMfaInstructions] = useState<boolean>(false);
  const [secret, setSecret] = useState<string>(''); // Store TOTP secret
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (username) {
        try {
          const response = await fetch(`/api/getSettings?username=${username}`);
          const data = await response.json();
          if (data.success) {
            setSettings(data.settings);
            if (data.settings.twoFactorAuth) {
              setSecret(data.settings.totpSecret); // Set secret if MFA is enabled
            }
          } else {
            setErrorMessage(data.message);
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
          setErrorMessage('Failed to load settings');
        }
      }
    };
    fetchUserSettings();
  }, [username]);

  // Handle language change
  const handleLanguageChange = (value: string) => {
    setSettings((prev) => ({ ...prev, language: value }));
  };

  // Toggle settings
  const handleToggle = (setting: keyof UserSettings) => {
    if (setting === 'twoFactorAuth') {
      if (!settings.twoFactorAuth) {
        // Generate TOTP secret and show instructions
        const newSecret = authenticator.generateSecret();
        setSecret(newSecret);
        setShowMfaInstructions(true);
      } else {
        // Logic to disable MFA if needed
        setSettings((prev) => ({ ...prev, [setting]: false, totpSecret: '' }));
      }
    } else {
      setSettings((prev) => ({ ...prev, [setting]: !prev[setting] }));
    }
  };

  // Save updated settings
  const handleSaveSettings = async () => {
    if (username) {
      try {
        const updatedSettings = { ...settings, totpSecret: secret }; // Include TOTP secret
        const response = await fetch(`/api/updateSettings?username=${username}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSettings),
        });
        const data = await response.json();
        if (data.success) {
          setSuccessMessage('Settings updated successfully!');
        } else {
          setErrorMessage(data.message);
        }
        resetMessages();
      } catch (error) {
        console.error('Failed to update settings:', error);
        setErrorMessage('Failed to update settings. Please try again.');
      }
    } else {
      setErrorMessage('User is not authenticated.');
    }
  };

  // Reset success and error messages after a delay
  const resetMessages = () => {
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 3000);
  };

  // Verify TOTP code
  const handleVerifyCode = () => {
    const isValid = authenticator.check(verificationCode, secret);
    if (isValid) {
      setSettings((prev) => ({ ...prev, twoFactorAuth: true }));
      setVerificationMessage('MFA has been enabled successfully!');
      setShowMfaInstructions(false);
    } else {
      setVerificationMessage('Invalid verification code. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
        <CardHeader className="bg-gray-800 text-white rounded-t-lg">
          <h2 className="text-2xl font-bold text-center">User Settings</h2>
        </CardHeader>
        <CardContent className="space-y-6 p-6 text-blue-800"> {/* Text color set to blue */}
          
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <div className="flex items-center space-x-4">
              <Moon className="text-gray-600" />
              <span>Dark Mode</span>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={() => handleToggle('darkMode')}
              className="bg-gray-300"
            />
          </div>
  
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <div className="flex items-center space-x-4">
              <Bell className="text-gray-600" />
              <span>Notifications</span>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={() => handleToggle('notifications')}
              className="bg-gray-300"
            />
          </div>
  
          {/* Two-Factor Authentication Toggle */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <div className="flex items-center space-x-4">
              <Lock className="text-gray-600" />
              <span>Two-Factor Authentication</span>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={() => handleToggle('twoFactorAuth')}
              className="bg-gray-300"
            />
          </div>
  
          {/* MFA Instructions Prompt */}
          {showMfaInstructions && (
            <div className="mt-4 p-4 border rounded bg-blue-50 relative">
              <button
                onClick={() => setShowMfaInstructions(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✖
              </button>
              <h3 className="text-lg font-semibold text-blue-800">MFA Instructions</h3>
              <p className="mt-2">Please enter the verification code from your authenticator app:</p>
  
              {/* Display the Setup Key */}
              <div className="mt-4">
                <p className="font-bold text-gray-800">Setup Key:</p>
                <p className="text-gray-600">{secret}</p>
              </div>
  
              <p className="mt-4">Use this setup key in your authenticator app.</p>
              <Input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="border border-gray-300 rounded p-2"
              />
              <Button onClick={handleVerifyCode} className="mt-2 w-full bg-gray-800 text-white">
                Verify Code
              </Button>
              {verificationMessage && <p className="mt-2 text-red-600">{verificationMessage}</p>}
            </div>
          )}
  
          {successMessage && <p className="text-green-600">{successMessage}</p>}
          {errorMessage && <p className="text-red-600">{errorMessage}</p>}
        </CardContent>
        <CardFooter className="p-4">
          <Button onClick={handleSaveSettings} className="w-full bg-gray-800 text-white">
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 

export default SettingsPage;
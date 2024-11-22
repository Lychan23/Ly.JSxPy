"use client"
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/authContext';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Bell, Moon, Lock } from 'lucide-react';
import { authenticator } from 'otplib';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

const SettingsPage = () => {
  const { user, refreshUserProfile } = useAuth();
  
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    twoFactorAuth: false,
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMfaInstructions, setShowMfaInstructions] = useState(false);
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.settings) {
      setSettings({
        darkMode: user.settings.darkMode || false,
        notifications: user.settings.notifications || true,
        twoFactorAuth: user.settings.twoFactorAuth || false,
      });
      if (user.settings.totpSecret) {
        setSecret(user.settings.totpSecret);
      }
    }
  }, [user]);

  const handleToggle = async (setting: keyof typeof settings) => {
    if (setting === 'twoFactorAuth' && !settings.twoFactorAuth) {
      const newSecret = authenticator.generateSecret();
      setSecret(newSecret);
      setShowMfaInstructions(true);
    } else {
      setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    }
  };

  const handleSaveSettings = async () => {
    if (user?.id) {
      try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          'settings.darkMode': settings.darkMode,
          'settings.notifications': settings.notifications,
          'settings.twoFactorAuth': settings.twoFactorAuth,
          'settings.totpSecret': secret,
          updatedAt: serverTimestamp(),
        });
        
        await refreshUserProfile();
        setSuccessMessage('Settings updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Failed to update settings:', error);
        setErrorMessage('Failed to update settings');
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  const handleVerifyCode = async () => {
    const isValid = authenticator.check(verificationCode, secret);
    if (isValid) {
      setSettings(prev => ({ ...prev, twoFactorAuth: true }));
      setVerificationMessage('MFA has been enabled successfully!');
      setShowMfaInstructions(false);
      await handleSaveSettings();
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
        <CardContent className="space-y-6 p-6">
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

          {showMfaInstructions && (
            <div className="mt-4 p-4 border rounded bg-blue-50 relative">
              <button
                onClick={() => setShowMfaInstructions(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ✖
              </button>
              <h3 className="text-lg font-semibold">MFA Instructions</h3>
              <p className="mt-2">Please enter the verification code from your authenticator app:</p>
              
              <div className="mt-4">
                <p className="font-bold">Setup Key:</p>
                <p className="text-gray-600">{secret}</p>
              </div>
              
              <Input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="mt-4"
              />
              <Button onClick={handleVerifyCode} className="mt-2 w-full">
                Verify Code
              </Button>
              {verificationMessage && (
                <p className="mt-2 text-sm text-blue-600">{verificationMessage}</p>
              )}
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
};

export default SettingsPage;
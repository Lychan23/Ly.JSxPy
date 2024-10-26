"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Bell, Moon, Globe, Lock } from 'lucide-react';
import type { UserSettings } from '@/types/auth';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const username = user?.username;

  const [settings, setSettings] = useState<UserSettings>({
    darkMode: false,
    notifications: true,
    language: 'en',
    twoFactorAuth: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load settings via API
  useEffect(() => {
    if (username) {
      fetch(`/api/getSettings?username=${username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setSettings(data.settings);
          else setErrorMessage(data.message);
        })
        .catch((error) => {
          console.error('Error loading user settings:', error);
          setErrorMessage('Failed to load settings');
        });
    }
  }, [username]);

  const handleToggle = (setting: keyof UserSettings) => {
    if (setting === 'twoFactorAuth' && !settings.twoFactorAuth) {
      router.push('/mfa-setup');
      return;
    }
    setSettings((prev) => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleLanguageChange = (value: string) => {
    setSettings((prev) => ({ ...prev, language: value }));
  };

  const handleSaveSettings = async () => {
    if (username) {
      try {
        const response = await fetch(`/api/updateSettings?username=${username}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });

        const data = await response.json();
        if (data.success) setSuccessMessage('Settings updated successfully!');
        else setErrorMessage(data.message);

        setTimeout(() => {
          setSuccessMessage(null);
          setErrorMessage(null);
        }, 3000);
      } catch (error) {
        console.error('Failed to update settings:', error);
        setErrorMessage('Failed to update settings. Please try again.');
      }
    } else {
      setErrorMessage('User is not authenticated.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">User Settings</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Moon className="text-gray-400" />
              <span>Dark Mode</span>
            </div>
            <Switch checked={settings.darkMode} onCheckedChange={() => handleToggle('darkMode')} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Bell className="text-gray-400" />
              <span>Notifications</span>
            </div>
            <Switch checked={settings.notifications} onCheckedChange={() => handleToggle('notifications')} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Globe className="text-gray-400" />
              <span>Language</span>
            </div>
            <Select onValueChange={handleLanguageChange} value={settings.language}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Lock className="text-gray-400" />
              <span>Two-Factor Authentication</span>
            </div>
            <Switch checked={settings.twoFactorAuth} onCheckedChange={() => handleToggle('twoFactorAuth')} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleSaveSettings}>Save Changes</Button>
          {successMessage && <p className="text-green-500">{successMessage}</p>}
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsPage;

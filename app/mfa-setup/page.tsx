"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/authContext';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MFASetupPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const username = user?.username;

  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      const response = await fetch('/api/sendVerificationCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });

      const data = await response.json();
      if (data.success) {
        setVerificationCode(data.code); // Store the verification code securely on the server
        setIsCodeSent(true);
        setSuccessMessage('Verification code sent to your email!');
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setErrorMessage('Failed to send verification code. Please try again.');
    }
  };

  const handleVerifyCode = async () => {
    if (code !== verificationCode) {
      setErrorMessage('Incorrect verification code. Please try again.');
      return;
    }

    try {
      const response = await fetch('/api/verifyCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Verification successful! MFA is now enabled.');
        // Here, you might want to update user settings to indicate MFA is enabled
        router.push('/settings'); // Redirect to the settings page or desired location
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setErrorMessage('Failed to verify code. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">MFA Setup</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isCodeSent ? (
            <>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4"
              />
              <Button onClick={handleSendCode}>Send Verification Code</Button>
            </>
          ) : (
            <>
              <Input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mb-4"
              />
              <Button onClick={handleVerifyCode}>Verify Code</Button>
            </>
          )}
          {successMessage && <p className="text-green-500">{successMessage}</p>}
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => router.push('/settings')}>Back to Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MFASetupPage;

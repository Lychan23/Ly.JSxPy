"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/app/context/authContext';

const MFASetupPage = () => {
  const router = useRouter(); // Access the router directly
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    // Redirect to login if user is not authenticated
    const generateMFASecret = async () => {
      try {
        const response = await fetch('/api/mfa/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (response.ok) {
          const data = await response.json();
          console.log(data); // Log the entire data object to see what's returned
          setQrCodeUrl(data.qrCode);
          setSecret(data.secret);
          setBackupCodes(data.backupCodes);
        } else {
          setError('Failed to generate MFA secret');
        }
      } catch (err) {
        setError('An error occurred while setting up MFA');
      }
    };
    

    generateMFASecret();
  }, [user]); // User dependency for redirect

  const handleVerify = async () => {
    try {
      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationCode, secret }),
      });

      if (response.ok) {
        // Handle successful verification
        // Redirect or show a success message
        router.push('/mfa-success'); // Adjust the success route as needed
      } else {
        setError('Verification failed');
      }
    } catch (err) {
      setError('An error occurred during verification');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">Set Up Two-Factor Authentication</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {qrCodeUrl && (
            <div className="text-center">
              <p className="mb-4">Scan this QR code with your authenticator app:</p>
              <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
            </div>
          )}
          <div>
            <Label htmlFor="verificationCode" className="block mb-2">Enter the verification code:</Label>
            <Input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>
          <Button
            onClick={handleVerify}
            className="bg-blue-500 text-white rounded px-4 py-2"
          >
            Verify
          </Button>
          {error && <p className="text-red-500">{error}</p>}
          {backupCodes.length > 0 && (
            <div>
              <h3 className="font-semibold mt-4">Backup Codes:</h3>
              <ul className="list-disc list-inside">
                {backupCodes.map((code, index) => (
                  <li key={index}>{code}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-gray-500">Make sure to save your backup codes!</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MFASetupPage;

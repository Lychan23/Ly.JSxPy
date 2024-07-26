"use client";
import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const acceptedCookies = document.cookie.split('; ').find(row => row.startsWith('accepted_cookies='));
    if (!acceptedCookies || acceptedCookies.split('=')[1] === 'false') {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = async () => {
    const res = await fetch('/api/accept-cookies', { method: 'POST' });
    if (res.ok) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 text-white text-center">
      <p>We use cookies to improve your experience. By using our site, you accept our use of cookies.</p>
      <button className="btn mt-2" onClick={acceptCookies}>Accept Cookies</button>
    </div>
  );
}

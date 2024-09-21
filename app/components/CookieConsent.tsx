"use client";
import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkCookieConsent = () => {
      const acceptedCookies = localStorage.getItem('accepted_cookies');
      setIsVisible(!acceptedCookies || acceptedCookies === 'false');
    };

    checkCookieConsent();
    window.addEventListener('storage', checkCookieConsent);

    return () => {
      window.removeEventListener('storage', checkCookieConsent);
    };
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('accepted_cookies', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 text-white text-center z-50">
      <p>We use cookies to improve your experience. By using our site, you accept our use of cookies.</p>
      <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={acceptCookies}>
        Accept Cookies
      </button>
    </div>
  );
}
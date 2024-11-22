"use client"
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useAuth } from '@/app/context/authContext';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

const ProfilePage = () => {
  const { user, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user?.id) {
      try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          username: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          avatarUrl: formData.avatarUrl,
          updatedAt: serverTimestamp(),
        });
        
        await refreshUserProfile();
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">User Profile</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={formData.avatarUrl} alt={formData.name} />
              <AvatarFallback>{formData.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            {!isEditing && user && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <User className="text-gray-400" />
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Name"
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center space-x-4">
                <Mail className="text-gray-400" />
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center space-x-4">
                <Phone className="text-gray-400" />
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone"
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center space-x-4">
                <MapPin className="text-gray-400" />
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Location"
                  disabled={!isEditing}
                />
              </div>
            </div>
            {isEditing && (
              <div className="mt-6 flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
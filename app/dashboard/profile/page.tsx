"use client";
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth(); // Get the logged-in user from context
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    avatarUrl: '', // Added for profile picture
  });

  // Load user profile from the server on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/getProfile?username=${user.username}`);
          const data = await response.json();
          if (data.success) {
            setFormData(data.profile);
          } else {
            console.error('Failed to load profile:', data.message);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user) { // Check if user is not null before proceeding
      try {
        const response = await fetch(`/api/updateProfile?username=${user.username}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (data.success) {
          setIsEditing(false); // Exit edit mode after successful update
        } else {
          console.error('Failed to update profile:', data.message);
        }
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
            {!isEditing && user && ( // Check if user is logged in before showing the button
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

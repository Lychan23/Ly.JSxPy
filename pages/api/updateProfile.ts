// File: /x:/Ly.JSxPy/pages/api/updateProfile.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises'; // Use the promises API
import path from 'path';

const updateProfile = async (req: NextApiRequest, res: NextApiResponse) => {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid username' });
    }

    if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Update the user profile path to the correct directory structure
    const userProfilePath = path.join(process.cwd(), 'database', 'users', username, `${username}.json`);

    try {
        // Attempt to read the existing profile
        const existingProfile = await fs.readFile(userProfilePath, 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => null); // Return null if reading fails

        // If profile exists, update it
        if (existingProfile) {
            const updatedProfile = {
                ...existingProfile,
                ...req.body,
                avatarUrl: req.body.avatarUrl || existingProfile.avatarUrl || 'http://example.com/default-avatar.jpg',
            };

            await fs.writeFile(userProfilePath, JSON.stringify(updatedProfile, null, 2), 'utf8');
            return res.status(200).json({ success: true, profile: updatedProfile });
        } else {
            // Create a new profile with default values if it doesn't exist
            const newProfile = {
                username: username,
                avatarUrl: 'http://example.com/default-avatar.jpg',
                name: "PLACEHOLDER",
                bio: "PLACEHOLDER",
                email: "PLACEHOLDER",
                // Add any other placeholder fields you need
            };

            // Ensure the directory exists before writing the new profile
            await fs.mkdir(path.dirname(userProfilePath), { recursive: true });
            await fs.writeFile(userProfilePath, JSON.stringify(newProfile, null, 2), 'utf8');
            return res.status(201).json({ success: true, profile: newProfile });
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export default updateProfile;

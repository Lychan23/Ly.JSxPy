// File: /x:/Ly.JSxPy/pages/api/getProfile.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises'; // Use the promises API
import path from 'path';

const getProfile = async (req: NextApiRequest, res: NextApiResponse) => {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid username' });
    }

    // Update the user profile path to the correct directory structure
    const userProfilePath = path.join(process.cwd(), 'database', 'users', username, `${username}.json`);

    try {
        // Check if the profile exists
        const data = await fs.readFile(userProfilePath, 'utf8');
        const profile = JSON.parse(data);
        return res.status(200).json({ success: true, profile });
    } catch (error) {
        // Check if the error is an instance of NodeJS.ErrnoException
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        } else {
            console.error('Error reading profile:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

export default getProfile;

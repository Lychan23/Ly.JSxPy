import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query;
  const userDir = path.join(process.cwd(), 'database', 'users', username as string);
  const filePath = path.join(userDir, 'settings.json');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Create the user directory if it doesn't exist
    await fs.mkdir(userDir, { recursive: true });

    // Check if the settings file exists
    try {
      const fileContents = await fs.readFile(filePath, 'utf8');
      const settings = JSON.parse(fileContents);
      return res.status(200).json({ success: true, settings });
    } catch (err) {
      console.error('Settings file not found:', err);
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to process user settings:', error);
      return res.status(500).json({ success: false, message: 'Error loading settings', error: error.message });
    }
    console.error('Unexpected error:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred' });
  }
}

import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query;
  const userDir = path.join(process.cwd(), 'database', 'users', username as string);
  const filePath = path.join(userDir, 'settings.json');

  if (req.method === 'PUT') {
    try {
      // Create the user directory if it doesn't exist
      await fs.mkdir(userDir, { recursive: true });

      // Write the new settings to the file
      await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
      return res.status(200).json({ success: true });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to write settings file:', error);
        return res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
      }
      console.error('Unexpected error:', error);
      return res.status(500).json({ success: false, message: 'An unexpected error occurred' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

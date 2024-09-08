// pages/api/save-theme.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import socketMiddleware, { ExtendedNextApiRequest } from '@/middleware/socketMiddleware';

const handler = async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(req.body, null, 2), 'utf8');
    req.io.emit('activity', 'Theme changed');
    res.send('Theme settings saved');
  } catch (error) {
    console.error('Error saving theme settings:', error);
    res.status(500).send('Error saving theme settings');
  }
};

export default socketMiddleware(handler);

import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    const data = await fs.readFile(settingsPath, 'utf8');
    const parsedData = JSON.parse(data);

    if (!parsedData.theme) {
      throw new Error("Theme not found in settings");
    }

    res.json(parsedData);
  } catch (error: unknown) {
    console.error('Error loading theme settings:', error);

    if (error instanceof Error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        res.status(404).send('Settings file not found');
      } else if (error instanceof SyntaxError) {
        res.status(500).send('Settings file contains invalid JSON');
      } else {
        res.status(500).send(`Error loading theme settings: ${error.message}`);
      }
    } else {
      res.status(500).send('Error loading theme settings');
    }
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const projectsPath = path.join(process.cwd(), 'projects');
    const files = await fs.readdir(projectsPath);
    const projects = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(projectsPath, file);
        const stat = await fs.stat(filePath);
        return stat.isDirectory() ? file : null;
      })
    );
    res.json(projects.filter((project) => project !== null));
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).send('Error fetching projects');
  }
}

import { NextApiRequest, NextApiResponse } from 'next';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const commands = {
    'start local': 'Starts the local server.',
    'start docker': 'Starts the docker server.',
    'stop local': 'Stops the local server.',
    'stop docker': 'Stops the docker server.',
    help: 'Displays this help message.',
  };
  
  res.status(200).json(commands);
};

export default handler;

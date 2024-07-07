import { NextApiRequest, NextApiResponse } from "next";
import os from "os";

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const cpuUsage = os.loadavg()[0].toFixed(2);
  const memoryUsage = ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2);
  const networkStats = {
    inbound: "N/A",
    outbound: "N/A",
  };
  const uptime = os.uptime();

  res.status(200).json({
    cpu: `${cpuUsage}%`,
    memory: `${memoryUsage}%`,
    networkInbound: networkStats.inbound,
    networkOutbound: networkStats.outbound,
    uptime: `${uptime} seconds`,
    currentTasks: "N/A", // Implement current task fetching logic if needed
  });
};

export default handler;

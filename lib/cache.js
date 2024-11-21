// lib/cache.js
import NodeCache from 'node-cache';

const verificationCache = new NodeCache({ stdTTL: 300 }); // 300 seconds (5 minutes) TTL

export default verificationCache;

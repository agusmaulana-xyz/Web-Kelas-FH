// Backward-compatible local command: node server.mjs
import { createServer } from 'vite';
const server = await createServer();
await server.listen();
server.printUrls();

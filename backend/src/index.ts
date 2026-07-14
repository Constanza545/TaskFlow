import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initDb } from './db/database';
import { seedDemoUsers } from './db/seed';
import { initSocket } from './ws/socket';

initDb();
void seedDemoUsers();

const app = createApp();
const server = createServer(app);
initSocket(server);

server.listen(env.port, () => {
  console.log(`TaskFlow API escuchando en http://localhost:${env.port}`);
});

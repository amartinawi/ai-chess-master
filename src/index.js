import dotenv from 'dotenv';
import { GameServer } from './server/GameServer.js';

dotenv.config();

const port = process.env.PORT || 3000;
const server = new GameServer(port);

server.start();
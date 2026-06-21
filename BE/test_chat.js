import { processChat } from './src/services/aiChatService.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const result = await processChat([{ role: 'user', content: 'hello' }]);
  console.log("Result:", result);
}
test();

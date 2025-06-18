import express from 'express';

import cors from 'cors';
import sseRouter from './routes/sse';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  console.log('Health check endpoint called');
  res.status(200).send('MCP Server is running. Use /sse endpoint for SSE connections.');
});

app.use('/sse', sseRouter);

const PORT = process.env.PORT || 3000;
console.log(`Attempting to start server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

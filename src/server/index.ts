import { sseRouter } from './routes/sse';
import { streamableHttpRouter } from './routes/streamable-http';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middlewares/auth';

const app = express();

declare global {
  namespace Express {
    interface Request {
      token?: string;
    }
  }
}

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  console.log('Health check endpoint called ');
  res.status(200).send('MCP Server is running. Use /sse endpoint for SSE connections.');
});

// Legacy SSE endpoints with auth
app.use('/sse', authMiddleware, sseRouter);

// Streamable HTTP with auth
app.use('/mcp', authMiddleware, streamableHttpRouter);

const PORT = process.env.PORT || 3000;
console.log(`Attempting to start server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const deepseekProxy = createProxyMiddleware({
  target: 'https://api.deepseek.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/chat': '/v1/chat/completions',
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Authorization', `Bearer ${process.env.DEEPSEEK_API_KEY}`);
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Cache-Control'] = 'no-cache';
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).send('Proxy Error');
  },
});

app.use('/api/chat', (req, res, next) => {
  console.log('Received request:', req.method, req.url, req.body);
  deepseekProxy(req, res, next);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
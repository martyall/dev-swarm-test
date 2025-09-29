import express from 'express';
import { logger } from './utils/logger';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.json({ message: 'Hello, TypeScript Express!' });
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
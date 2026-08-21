import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', backend: 'express', version: '1.0.0' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Express corriendo en http://0.0.0.0:${PORT}`);
});
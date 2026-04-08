import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './src/routes/auth.routes.js';
import reviewRoutes from './src/routes/review.routes.js';
import voteRoutes from './src/routes/vote.routes.js';
import commentRoutes from './src/routes/comment.routes.js';
import searchRoutes from './src/routes/search.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reviews/:id/vote', voteRoutes);
app.use('/api/reviews/:id/comments', commentRoutes);
app.use('/api/search', searchRoutes);

export default app;

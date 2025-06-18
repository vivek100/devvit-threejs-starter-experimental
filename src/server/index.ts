import express from 'express';
import { createServer, context } from '@devvit/server';

import {
  leaderboardForPostForUserGet,
  leaderboardForPostGet,
  leaderboardForPostUpsertIfHigherScore,
} from './core/leaderboardForPost';
import { setPlayingIfNotExists, userGetOrSet, noUser } from './core/user';
import { GameOverResponse, LeaderboardResponse } from '../shared/types/game';
import { type InitMessage } from '../shared/types/message';
import { postConfigGet } from './core/post';
import { reddit } from '@devvit/reddit';
import { redis } from '@devvit/redis';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitMessage | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { userId, postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res
        .status(400)
        .json({ status: 'error', message: 'postId is required but missing from context' });
      return;
    }

    try {
      const [postConfig, user, leaderboard, userAllTimeStats] = await Promise.all([
        postConfigGet({ redis, postId }),
        userGetOrSet({ redis, userId, reddit }),
        leaderboardForPostGet({ redis, postId, limit: 4 }),
        leaderboardForPostForUserGet({
          redis,
          postId,
          userId: userId ?? noUser().id,
        }),
      ]);

      res.json({
        type: 'init',
        postConfig,
        user,
        userAllTimeStats,
        postId: postId,
        leaderboard,
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(500).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, GameOverResponse, { score: number }>(
  '/api/post/game-over',
  async (req, res): Promise<void> => {
    const { score } = req.body;

    const { postId, userId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    if (score == null) {
      res.status(400).json({
        status: 'error',
        message: 'score is required',
      });
      return;
    }

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'Must be logged in to play',
      });
      return;
    }

    await userGetOrSet({
      redis,
      userId,
      reddit,
    });

    await Promise.all([
      leaderboardForPostUpsertIfHigherScore({
        redis,
        postId,
        userId,
        score: score,
      }),
      setPlayingIfNotExists({
        redis,
        userId,
      }),
    ]);

    const [leaderboard, userAllTimeStats] = await Promise.all([
      leaderboardForPostGet({
        redis,
        postId,
      }),
      leaderboardForPostForUserGet({
        redis,
        postId,
        userId,
      }),
    ]);
    res.json({
      status: 'success',
      leaderboard,
      userAllTimeStats,
    });
  }
);

router.get<{ postId: string }, LeaderboardResponse>(
  '/api/post/leaderboard',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    const leaderboard = await leaderboardForPostGet({
      redis,
      postId,
    });

    res.json({
      status: 'success',
      leaderboard,
    });
  }
);

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = process.env.WEBBIT_PORT || 3000;

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`http://localhost:${port}`));

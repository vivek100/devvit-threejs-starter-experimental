import type { Devvit } from '@devvit/public-api';
import type { User } from '../../shared/types/user';
import { noUsername, noSnoovatarURL, noId } from '../../shared/types/user';
import { RedditClient } from '@devvit/reddit';
import { RedisClient } from '@devvit/redis';

export function noUser(): User {
  return {
    id: noId,
    username: noUsername,
    snoovatarUrl: noSnoovatarURL,
  };
}

// 2 because I switch this over to a hash and we don't have a way
// to truncate redis for an app at the moment
const getUserKey = (userId: string) => `user:${userId}` as const;

export const userMaybeGet = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis'] | RedisClient;
  userId: string;
}): Promise<User | undefined> => {
  const user = await redis.hGetAll(getUserKey(userId));

  if (Object.keys(user).length === 0) {
    return undefined;
  }

  return deserialize(user);
};

export const userGet = async (args: {
  redis: Devvit.Context['redis'] | RedisClient;
  userId: string;
}): Promise<User> => {
  const user = await userMaybeGet(args);

  if (!user) {
    throw new Error(`No user found: ${args.userId}`);
  }

  return user;
};

export const setPlayingIfNotExists = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis'] | RedisClient;
  userId: string;
}): Promise<number> => {
  const result = await redis.hSetNX(
    getUserKey(userId),
    'startedPlayingAt',
    new Date().toISOString()
  );

  return result;
};

export const userSet = async ({
  redis,
  user,
}: {
  redis: Devvit.Context['redis'] | RedisClient;
  // TODO: Shouldn't need to submit the entire user anymore since we're using a hash
  user: User;
}): Promise<void> => {
  await redis.hSet(getUserKey(user.id), serialize(user));
};

export const userGetOrSet = async ({
  redis,
  userId,
  reddit,
}: {
  redis: Devvit.Context['redis'] | RedisClient;
  userId: string | undefined;
  reddit: Devvit.Context['reddit'] | RedditClient;
}): Promise<User> => {
  if (!userId) return noUser();

  const maybeProfile = await userMaybeGet({
    redis,
    userId,
  });

  if (maybeProfile) return maybeProfile;

  const userProfile = await reddit.getUserById(userId);
  if (!userProfile) return noUser();
  const avatar = await reddit.getSnoovatarUrl(userProfile.username);

  const user: User = {
    id: userProfile.id,
    username: userProfile.username,
    snoovatarUrl: avatar ?? noSnoovatarURL,
  };

  await userSet({
    redis,
    user,
  });

  return user;
};

function serialize(config: Partial<User>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (value === undefined) {
        return [key, ''];
      }
      return [key, value.toString()];
    })
  );
}

function deserialize(config: Record<string, string>): User {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      let val;

      const numberKeys: (keyof User)[] = [];
      if (numberKeys.includes(key as keyof User)) {
        val = parseFloat(value);
        if (Number.isNaN(val)) {
          throw new Error(`Invalid number for key: ${key}`);
        }
        return [key, val];
      }

      const boolKeys: (keyof User)[] = [];
      if (boolKeys.includes(key as keyof User)) {
        val = value === 'true';
        return [key, val];
      }

      return [key, value];
    })
  ) as User;
}

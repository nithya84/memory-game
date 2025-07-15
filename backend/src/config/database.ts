import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1'
});

export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const TABLE_NAMES = {
  USERS: process.env.USERS_TABLE || 'memory-game-users',
  THEMES: process.env.THEMES_TABLE || 'memory-game-themes', 
  GAMES: process.env.GAMES_TABLE || 'memory-game-games',
  SESSIONS: process.env.SESSIONS_TABLE || 'memory-game-sessions'
};
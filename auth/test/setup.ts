import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(__dirname, '../.env.test') });

// Set test timeout
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  console.log('🧪 Test environment setup');
  console.log('  - AWS_ENDPOINT_URL:', process.env.AWS_ENDPOINT_URL);
  console.log('  - DYNAMODB_TABLE_NAME:', process.env.DYNAMODB_TABLE_NAME);
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
});

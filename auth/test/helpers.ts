import e from "express";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateRandomString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * charactersLength),
    );
  }
  return result;
}

// DynamoDB test helper
export class DynamoDBTestHelper {
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    this.client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.AWS_ENDPOINT_URL,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });
    
    this.docClient = DynamoDBDocumentClient.from(this.client);
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'Users-test';
  }

  async clearTable(): Promise<void> {
    try {
      // Scan all items
      const scanResult = await this.docClient.send(new ScanCommand({
        TableName: this.tableName,
      }));

      // Delete all items
      if (scanResult.Items && scanResult.Items.length > 0) {
        const deletePromises = scanResult.Items.map(item =>
          this.docClient.send(new DeleteCommand({
            TableName: this.tableName,
            Key: { id: item.id },
          }))
        );

        await Promise.all(deletePromises);
        console.log(`🧹 Cleared ${scanResult.Items.length} items from ${this.tableName}`);
      }
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`ℹ️  Table ${this.tableName} does not exist yet`);
      } else {
        console.error('❌ Error clearing table:', error);
        throw error;
      }
    }
  }

  async waitForTable(): Promise<void> {
    // Since we're using the UserRepository which creates the table,
    // we just need to make sure the service is available
    console.log(`⏳ Waiting for table ${this.tableName} to be ready...`);
    // The table will be created automatically by UserRepository when first accessed
  }
}

export const dynamoTestHelper = new DynamoDBTestHelper();
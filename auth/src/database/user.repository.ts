import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  QueryCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { 
  CreateTableCommand,
  DescribeTableCommand 
} from '@aws-sdk/client-dynamodb';
import { User } from '../interfaces/auth.interfaces';

@Injectable()
export class UserRepository {
  private readonly tableName = 'Users';

  constructor(
    @Inject('DYNAMODB_CLIENT')
    private readonly dynamoClient: DynamoDBDocumentClient,
  ) {
    this.ensureTableExists();
  }

  private async ensureTableExists() {
    try {
      // Check if table exists
      await this.dynamoClient.send(new DescribeTableCommand({
        TableName: this.tableName,
      }));
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        // Table doesn't exist, create it
        await this.createTable();
      } else {
        console.error('Error checking table existence:', error);
      }
    }
  }

  private async createTable() {
    const command = new CreateTableCommand({
      TableName: this.tableName,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }, // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    });

    try {
      await this.dynamoClient.send(command);
      console.log(`Table ${this.tableName} created successfully`);
    } catch (error) {
      console.error('Error creating table:', error);
    }
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
      },
    });

    await this.dynamoClient.send(command);
    return newUser;
  }

  async findUserById(id: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const result = await this.dynamoClient.send(command);
    
    if (!result.Item) {
      return null;
    }

    return {
      ...result.Item,
      createdAt: new Date(result.Item.createdAt),
      updatedAt: new Date(result.Item.updatedAt),
    } as User;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const result = await this.dynamoClient.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const item = result.Items[0];
    return {
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    } as User;
  }

  async getAllUsers(): Promise<User[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
    });

    const result = await this.dynamoClient.send(command);
    
    if (!result.Items) {
      return [];
    }

    return result.Items.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })) as User[];
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const existingUser = await this.findUserById(id);
    if (!existingUser) {
      return null;
    }

    const updatedUser = {
      ...existingUser,
      ...updates,
      updatedAt: new Date(),
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...updatedUser,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    });

    await this.dynamoClient.send(command);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      });

      await this.dynamoClient.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}

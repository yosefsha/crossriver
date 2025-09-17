import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

@Global()
@Module({
  providers: [
    {
      provide: 'DYNAMODB_CLIENT',
      useFactory: (configService: ConfigService) => {
        const endpoint = configService.get('AWS_ENDPOINT_URL', 'http://localhost:8000');
        
        const client = new DynamoDBClient({
          region: configService.get('AWS_REGION', 'us-east-1'),
          endpoint: endpoint,
          credentials: {
            accessKeyId: configService.get('AWS_ACCESS_KEY_ID', 'test'),
            secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY', 'test'),
          },
          maxAttempts: 3,
        });

        console.log(`🗄️  DynamoDB client configured with endpoint: ${endpoint}`);

        return DynamoDBDocumentClient.from(client);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DYNAMODB_CLIENT'],
})
export class DynamoDbModule {}

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  httpsPort: number;
  mongoUri: string;
  jwtSecret: string;
  nodeEnv: string;
  clientPath: string;
  sslKeyPath: string;
  sslCertPath: string;
}

const config: Config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  httpsPort: parseInt(process.env['HTTPS_PORT'] || '3043', 10),
  mongoUri: process.env['MONGODB_URI'] || 'mongodb://127.0.0.1:27017/local',
  jwtSecret: process.env['JWT_SECRET'] || 'this_is_the_secret_secret_secret_12356',
  nodeEnv: process.env['NODE_ENV'] || 'development',
  clientPath: path.resolve(__dirname, '../../../dist/auction-sar'),
  sslKeyPath: path.resolve(__dirname, '../../key.pem'),
  sslCertPath: path.resolve(__dirname, '../../cert.pem')
};

export default config;
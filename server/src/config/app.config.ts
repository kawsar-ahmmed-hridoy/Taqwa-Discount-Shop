export interface AppConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  API_PREFIX: string;
  LOG_LEVEL: string;
  CORS_ORIGIN: string[];
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  GMAIL_USER: string;
  GMAIL_APP_PASSWORD: string;
  GMAIL_FROM_NAME: string;
  STAFF_VERIFICATION_EXPIRY_MINUTES: number;
}


export const loadConfig = (): AppConfig => {
  const nodeEnv = (process.env.NODE_ENV || 'development') as AppConfig['NODE_ENV'];
  const port = Number(process.env.PORT) || 5000;
  const host = process.env.HOST || 'localhost';
  const apiPrefix = process.env.API_PREFIX || '/api';
  const logLevel = process.env.LOG_LEVEL || 'info';
  const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
  const jwtSecret = process.env.JWT_SECRET || "it's hridoy, change in production";
  const jwtExpiry = process.env.JWT_EXPIRES_IN || '24h';
  const gmailUser = process.env.GMAIL_USER || '';
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || '';
  const gmailFromName = process.env.GMAIL_FROM_NAME || 'Taqwa POS';
  const staffVerificationExpiryMinutes = Number(process.env.STAFF_VERIFICATION_EXPIRY_MINUTES) || 10;

  if (!jwtSecret || jwtSecret === "it's hridoy, change in production") {
    console.warn('⚠️  Warning: JWT_SECRET is not properly configured. Change it in production!');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    HOST: host,
    API_PREFIX: apiPrefix,
    LOG_LEVEL: logLevel,
    CORS_ORIGIN: corsOrigin,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRY: jwtExpiry,
    GMAIL_USER: gmailUser,
    GMAIL_APP_PASSWORD: gmailAppPassword,
    GMAIL_FROM_NAME: gmailFromName,
    STAFF_VERIFICATION_EXPIRY_MINUTES: staffVerificationExpiryMinutes,
  };
};

export const config = loadConfig();

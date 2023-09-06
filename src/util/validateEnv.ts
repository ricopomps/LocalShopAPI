import { cleanEnv, port, str } from "envalid";

export default cleanEnv(process.env, {
  MONGO_CONNECTION_STRING: str(),
  PORT: port(),
  SESSION_SECRET: str(),
  FRONT_URL: str(),
  ENVIROMENT: str(),
  ACCESS_TOKEN_SECRET: str(),
  REFRESH_TOKEN_SECRET: str(),
  EMAIL_HOST: str(),
  EMAIL_SMTP_PORT: str(),
  EMAIL_FROM: str(),
  EMAIL_FROM_NAME: str(),
  EMAIL_USER: str(),
  EMAIL_PASS: str(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_SECRET_KEY: str(),
  GOOGLE_REDIRECT_URL: str(),
});

import { OAuth2Client } from "google-auth-library";
import { UserType } from "../models/user";
import env from "../util/validateEnv";

export interface IAuthService {
  googleAuthRequest(userType?: UserType): Promise<{ authorizedUrl: string }>;
  googleAuth(code: string): Promise<any>;
}

export class AuthService implements IAuthService {
  constructor() {
    //build
  }
  async googleAuthRequest(
    userType?: UserType
  ): Promise<{ authorizedUrl: string }> {
    const redirectUrl = env.GOOGLE_REDIRECT_URL;

    const oAuth2Client = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_SECRET_KEY,
      redirectUrl
    );

    const authorizedUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope:
        "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid",
      prompt: "consent",
      state: userType,
    });
    return { authorizedUrl };
  }

  async googleAuth(code: string): Promise<any> {
    const redirectUrl = env.GOOGLE_REDIRECT_URL;

    const oAuth2Client = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_SECRET_KEY,
      redirectUrl
    );

    const token = await oAuth2Client.getToken(code);
    await oAuth2Client.setCredentials(token.tokens);

    const user = oAuth2Client.credentials;
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${user.access_token}`
    );
    const data = await response.json();

    return data;
  }
}

import jwt from "jsonwebtoken";

declare namespace jwt {
  interface JwtPayload {
    user: string;
    userType: string;
  }
}

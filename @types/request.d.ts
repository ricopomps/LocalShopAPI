declare namespace Express {
  interface Request {
    user: string;
    userId: string;
    storeId: string;
    userType: string;
  }
}

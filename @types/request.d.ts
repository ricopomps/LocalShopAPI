declare namespace Express {
  interface Request {
    user: string;
    userId: import("mongoose").Types.ObjectId;
    storeId: import("mongoose").Types.ObjectId;
    userType: string;
  }
}

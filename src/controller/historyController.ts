import { RequestHandler } from "express";
import HistoryModel from "../models/history";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { assertIsDefined } from "../util/assertIsDefined";

export const getHistoryByUser: RequestHandler = async (req, res, next) => {
    try {
      const authenticatedStoreId = req.storeId;
      assertIsDefined(authenticatedStoreId);
  
      const products = await ProductModel.find({
        storeId: authenticatedStoreId,
      }).exec();
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }; History

  export const updateHistory: RequestHandler = async (req, res, next) => {
    
  };


  export const createHistory: RequestHandler = async (req, res, next) => {
    
  };
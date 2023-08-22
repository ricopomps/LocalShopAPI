import { RequestHandler } from "express";
import MapModel, { MapCellTypes } from "../models/map";
import { assertIsDefined } from "../util/assertIsDefined";

interface CreateUpdateMapBody {
  items: MapItems[];
}

interface MapItems {
  x: number;
  y: number;
  type: MapCellTypes;
}

export const createUpdateMap: RequestHandler<
  unknown,
  unknown,
  CreateUpdateMapBody,
  unknown
> = async (req, res, next) => {
  try {
    const storeId = req.storeId;
    assertIsDefined(storeId);
    const { items } = req.body;

    const existingMap = await MapModel.findOne({ storeId }).exec();
    if (existingMap) {
      existingMap.items = items;
      await existingMap.save();
    } else {
      await MapModel.create({
        storeId,
        items,
      });
    }
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

interface GetStoreMapParams {
  storeId?: string;
}

export const getMap: RequestHandler<
  GetStoreMapParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    assertIsDefined(storeId);

    const map = await MapModel.findOne({ storeId }).exec();

    res.status(200).json(map);
  } catch (error) {
    next(error);
  }
};

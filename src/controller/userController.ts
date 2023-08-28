import { RequestHandler } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import UserModel, { UserType } from "../models/user";
import { assertIsDefined } from "../util/assertIsDefined";
import mongoose from "mongoose";
import env from "../util/validateEnv";
import jwt from "jsonwebtoken";

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = req.userId;

    const user = await UserModel.findById(authenticatedUserId)
      .select("+email +cpf")
      .exec();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

interface SignUpBody {
  username?: string;
  email?: string;
  password?: string;
  confirmedPassword?: string;
  cpf?: string;
  userType?: UserType;
}

export const signUp: RequestHandler<
  unknown,
  unknown,
  SignUpBody,
  unknown
> = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password: passwordRaw,
      userType,
      confirmedPassword,
      cpf,
    } = req.body;

    if (!username || !email || !passwordRaw || !confirmedPassword || !cpf)
      throw createHttpError(400, "Parâmetros inválidos ");

    const existingUsername = await UserModel.findOne({ username }).exec();

    if (existingUsername)
      throw createHttpError(409, "Nome do usuário já existe");

    const existingEmail = await UserModel.findOne({ email }).exec();

    if (existingEmail) throw createHttpError(409, "Email já cadastrado");

    const existingCpf = await UserModel.findOne({ cpf }).exec();

    if (existingCpf) throw createHttpError(400, "CPF já cadastrado");

    if (confirmedPassword !== passwordRaw) {
      throw createHttpError(400, "Senhas não coincidem!");
    }

    const passwordHashed = await bcrypt.hash(passwordRaw, 10);

    const newUser = await UserModel.create({
      username,
      email,
      password: passwordHashed,
      userType,
      cpf,
    });

    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: newUser.username,
          userId: newUser._id,
          userType: newUser.userType,
        },
      },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { username: newUser.username, userId: newUser._id },
      env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    req.userId = newUser._id.toString();

    res.status(201).json({ user: newUser, accessToken });
  } catch (error) {
    next(error);
  }
};

interface LoginBody {
  username?: string;
  password?: string;
}

export const login: RequestHandler<
  unknown,
  unknown,
  LoginBody,
  unknown
> = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      throw createHttpError(400, "Parâmetros faltando");

    const user = await UserModel.findOne({ username })
      .select("+password +email")
      .exec();

    if (!user) throw createHttpError(401, "Credenciais inválidas");

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) throw createHttpError(401, "Credenciais inválidas");

    req.userId = user._id.toString();
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(200);
    }
  });
};

export const favoriteProduct: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = req.userId;
    assertIsDefined(authenticatedUserId);

    const { productId } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      throw createHttpError(400, "ID de produto inválida.");
    }

    const user = await UserModel.findById(authenticatedUserId);

    if (!user) {
      throw createHttpError(404, "Usuário não encontrado!");
    }

    if (user.favoriteProducts && user.favoriteProducts.includes(productId)) {
      throw createHttpError(400, "Produto já foi favoritado!");
    }

    user.favoriteProducts = [...user.favoriteProducts, productId];

    await user.save();

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const favoriteStores: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = req.userId;
    assertIsDefined(authenticatedUserId);

    const { storeId } = req.body;

    if (!mongoose.isValidObjectId(storeId)) {
      throw createHttpError(400, "ID de loja inválida.");
    }

    const user = await UserModel.findById(authenticatedUserId);

    if (!user) {
      throw createHttpError(400, "Usuário não encontrado!");
    }

    if (user.favoriteStores && user.favoriteStores.includes(storeId)) {
      throw createHttpError(400, "Loja já foi favoritado!");
    }

    user.favoriteStores = [...user.favoriteStores, storeId];

    await user.save();

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

interface UpdateUserBody {
  username?: string;
  email?: string;
}

export const updateUser: RequestHandler<
  unknown,
  unknown,
  UpdateUserBody,
  unknown
> = async (req, res, next) => {
  try {
    const userId = req.userId;
    assertIsDefined(userId);

    const user = await UserModel.findById(userId).exec();
    if (!user) throw createHttpError(404, "Usuário não encontrado!");

    const { username, email } = req.body;

    user.username = username ?? user.username;
    user.email = email ?? user.email;
    await user.save();

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const unFavoriteProduct: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = req.userId;
    assertIsDefined(authenticatedUserId);

    const { productId } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      throw createHttpError(400, "ID de produto inválida.");
    }

    const user = await UserModel.findById(authenticatedUserId);

    if (!user) {
      throw createHttpError(404, "Usuário não encontrado!");
    }

    if (user.favoriteProducts && user.favoriteProducts.includes(productId)) {
      throw createHttpError(400, "Produto já foi favoritado!");
    }

    const indexToRemove = user.favoriteProducts.indexOf(productId);

    if (indexToRemove !== -1) {
      user.favoriteProducts.splice(indexToRemove, 1);
    }

    await user.save();

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const unFavoriteStores: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = req.userId;
    assertIsDefined(authenticatedUserId);

    const { storeId } = req.body;

    if (!mongoose.isValidObjectId(storeId)) {
      throw createHttpError(400, "ID de loja inválida.");
    }

    const user = await UserModel.findById(authenticatedUserId);

    if (!user) {
      throw createHttpError(400, "Usuário não encontrado!");
    }

    if (user.favoriteStores && !user.favoriteStores.includes(storeId)) {
      throw createHttpError(400, "Loja não consta na lista de favoritos!");
    }

    const indexToRemove = user.favoriteStores.indexOf(storeId);

    if (indexToRemove !== -1) {
      user.favoriteStores.splice(indexToRemove, 1);
    }

    await user.save();

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
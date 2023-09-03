import { RequestHandler } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import UserModel from "../models/user";
import StoreModel from "../models/store";
import TokenModel from "../models/token";
import env from "../util/validateEnv";
import jwt from "jsonwebtoken";
import { EmailService } from "../service/emailService";

const emailService = new EmailService();

interface LoginBody {
  username?: string;
  password?: string;
}

export const auth: RequestHandler<
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
      .select("+password +email +cpf")
      .exec();

    if (!user) throw createHttpError(401, "Credenciais inválidas");

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) throw createHttpError(401, "Credenciais inválidas");

    const store = await StoreModel.findOne({
      users: { $in: [user._id] },
    }).exec();

    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: user.username,
          userId: user._id,
          storeId: store?._id,
          userType: user.userType,
        },
      },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { username: user.username, userId: user._id },
      env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: passwordUser, ...safeUser } = user.toObject();
    res.status(201).json({ user: safeUser, accessToken });
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler<
  unknown,
  unknown,
  LoginBody,
  unknown
> = async (req, res, next) => {
  try {
    const cookies = req.cookies;

    if (!cookies.jwt) return res.status(401).json({ message: "Unauthorized" });

    const refreshToken = cookies.jwt;

    jwt.verify(
      refreshToken,
      env.REFRESH_TOKEN_SECRET,
      {},
      async (err, decoded: any) => {
        if (err) return res.status(403).json({ message: "Forbidden" });

        const foundUser = await UserModel.findOne({
          _id: decoded?.userId,
        }).exec();

        if (!foundUser)
          return res.status(401).json({ message: "Unauthorized" });

        const store = await StoreModel.findOne({
          users: { $in: [foundUser._id] },
        }).exec();

        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: foundUser.username,
              userId: foundUser._id,
              storeId: store?._id,
              userType: foundUser.userType,
            },
          },
          env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        res.json({ accessToken });
      }
    );
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler<
  unknown,
  unknown,
  LoginBody,
  unknown
> = async (req, res, next) => {
  try {
    const cookies = req.cookies;

    if (!cookies.jwt) return res.sendStatus(204);

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Success" });
  } catch (error) {
    next(error);
  }
};

interface SendRecoverPasswordEmailBody {
  email?: string;
}

export const sendRecoverPasswordEmail: RequestHandler<
  unknown,
  unknown,
  SendRecoverPasswordEmailBody,
  unknown
> = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw createHttpError(401, "Credenciais inválidas");

    const user = await UserModel.findOne({ email }).exec();
    if (!user) throw createHttpError(401, "Credenciais inválidas");

    const validMinutes = 15;
    const token = await TokenModel.create({
      user: user.id,
      expireAt: new Date(new Date().getTime() + validMinutes * 60000),
    });

    if (!token)
      throw createHttpError(500, "Falha ao criar o token de segurança");

    const link = `${env.FRONT_URL}/recover?token=${token._id}`;

    const response = await emailService.sendEmail(
      email,
      "Recuperação de senha",
      `Para recuperar a senha, acesse esse link: ${link}`,
      `<p>Para recuperar a senha, acesse esse link: </p><a>${link}</a>`
    );

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

interface ChangePasswordBody {
  token: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export const changePassword: RequestHandler<
  unknown,
  unknown,
  ChangePasswordBody,
  unknown
> = async (req, res, next) => {
  try {
    const { token, newPassword, newPasswordConfirmation } = req.body;
    if (!token) throw createHttpError(401, "Credenciais inválidas");
    if (newPassword !== newPasswordConfirmation)
      throw createHttpError(401, "Senhas diferentes");

    const existingToken = await TokenModel.findById(token).exec();
    if (!existingToken) throw createHttpError(401, "Token inválido");

    const passwordHashed = await bcrypt.hash(newPassword, 10);

    const user = await UserModel.findByIdAndUpdate(existingToken.user, {
      password: passwordHashed,
    }).exec();

    if (!user)
      throw createHttpError(404, "Não foi possível encontrar o usuário");

    await TokenModel.findByIdAndDelete(token).exec();

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

import { RequestHandler } from "express";
import NoteModel from "../models/note";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { assertIsDefined } from "../util/assertIsDefined";

export const getNotes: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = req.session.userId;
    assertIsDefined(authenticatedUserId);
    const notes = await NoteModel.find({ userId: authenticatedUserId }).exec();
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

export const getNote: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = req.session.userId;
    assertIsDefined(authenticatedUserId);
    const { noteId } = req.params;
    if (!mongoose.isValidObjectId(noteId)) {
      throw createHttpError(400, "Id inválido");
    }

    const note = await NoteModel.findById(noteId).exec();

    if (!note) {
      throw createHttpError(404, "Note não encontrada");
    }

    if (!note.userId.equals(authenticatedUserId))
      throw createHttpError(
        401,
        "Usuário não possui permissão para acessar essa informação"
      );

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

interface createNoteBody {
  title?: string;
  text?: string;
}

export const createNotes: RequestHandler<
  unknown,
  unknown,
  createNoteBody,
  unknown
> = async (req, res, next) => {
  try {
    const authenticatedUserId = req.session.userId;
    assertIsDefined(authenticatedUserId);
    const { title, text } = req.body;
    if (!title) {
      throw createHttpError(400, "O Titúlo é obrigatório");
    }

    const newNote = await NoteModel.create({
      userId: authenticatedUserId,
      title,
      text,
    });
    res.status(201).json(newNote);
  } catch (error) {
    next(error);
  }
};

interface UpdateNoteParams {
  noteId: string;
}

interface UpdateNoteBody {
  title?: string;
  text?: string;
}

export const updateNote: RequestHandler<
  UpdateNoteParams,
  unknown,
  UpdateNoteBody,
  unknown
> = async (req, res, next) => {
  try {
    const authenticatedUserId = req.session.userId;
    assertIsDefined(authenticatedUserId);
    const { noteId } = req.params;
    const { title: newTitle, text: newText } = req.body;

    if (!mongoose.isValidObjectId(noteId)) {
      throw createHttpError(400, "Id inválido");
    }

    if (!newTitle) {
      throw createHttpError(400, "O Titúlo é obrigatório");
    }

    const note = await NoteModel.findById(noteId).exec();

    if (!note) {
      throw createHttpError(404, "Note não encontrada");
    }

    if (!note.userId.equals(authenticatedUserId))
      throw createHttpError(
        401,
        "Usuário não possui permissão para acessar essa informação"
      );

    note.title = newTitle;
    note.text = newText;

    const updatedNote = await note.save();

    res.status(200).json(updatedNote);
  } catch (error) {
    next(error);
  }
};

export const deleteNote: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = req.session.userId;
    assertIsDefined(authenticatedUserId);
    const { noteId } = req.params;

    if (!mongoose.isValidObjectId(noteId)) {
      throw createHttpError(400, "Id inválido");
    }

    const note = await NoteModel.findById(noteId).exec();

    if (!note) {
      throw createHttpError(404, "Note não encontrada");
    }

    if (!note.userId.equals(authenticatedUserId))
      throw createHttpError(
        401,
        "Usuário não possui permissão para acessar essa informação"
      );

    await note.deleteOne();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

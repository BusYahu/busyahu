import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db';
import { IUser, toUserResponseDTO } from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_busyahu_prog3_2026_secure';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const db = getDB();
    const usersCollection = db.collection<IUser>('users');

    // 1. Criterio de Aceptación: Bloqueo de registro para correos duplicados con 400 Bad Request
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await usersCollection.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'El correo electrónico ya se encuentra registrado.',
      });
      return;
    }

    // 2. Hasheo seguro con bcryptjs (Salt 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: IUser = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      createdAt: new Date(),
    };

    const insertResult = await usersCollection.insertOne(newUser);
    newUser._id = insertResult.insertedId;

    // 3. Generar token JWT con opciones tipadas
    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN };
    const token = jwt.sign(
      { id: newUser._id.toHexString(), email: newUser.email, role: newUser.role },
      JWT_SECRET,
      signOptions
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      token,
      user: toUserResponseDTO(newUser),
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error interno al registrar usuario.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const db = getDB();
    const usersCollection = db.collection<IUser>('users');

    const normalizedEmail = email.toLowerCase().trim();
    const user = await usersCollection.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Credenciales inválidas.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Credenciales inválidas.',
      });
      return;
    }

    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN };
    const token = jwt.sign(
      { id: user._id!.toHexString(), email: user.email, role: user.role },
      JWT_SECRET,
      signOptions
    );

    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: toUserResponseDTO(user),
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error interno al autenticar usuario.' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDB();
    const user = await db.collection<IUser>('users').findOne({ _id: new ObjectId(req.user!.id) });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Usuario no encontrado.',
      });
      return;
    }

    res.status(200).json({
      user: toUserResponseDTO(user),
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al obtener datos del usuario.' });
  }
}
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db';
import { IUser } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_busyahu_prog3_2026_secure';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export async function verifyToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token de autenticación no proporcionado o formato inválido.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: 'user' | 'admin' };
    
    // Opcional: verificar que el usuario continúe existiendo en MongoDB
    const db = getDB();
    const user = await db.collection<IUser>('users').findOne({ _id: new ObjectId(decoded.id) });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'El usuario asociado a este token ya no existe.',
      });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o expirado.',
    });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Acceso denegado: se requieren permisos de administrador.',
    });
    return;
  }
  next();
}
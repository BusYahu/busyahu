import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { register, login, getMe } from '../controllers/auth.controllers';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Esquemas Zod para validación de entrada
const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('El correo electrónico no es válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Middleware genérico de validación con Zod tipado
function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Bad Request',
        details: result.error.issues.map((issue: z.ZodIssue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// Rutas Públicas
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

// Rutas Protegidas
router.get('/me', verifyToken, getMe);

export default router;
import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  generateBookingQr,
} from '../controllers/bookings.controller';

const router = Router();

// Rutas públicas y autenticadas con el mismo contrato que FastAPI.
router.post('/qr', generateBookingQr);
router.post('/', verifyToken, createBooking);
router.get('/my-bookings', verifyToken, getMyBookings);
router.get('/:id', verifyToken, getBookingById);
router.delete('/:id', verifyToken, cancelBooking);

export default router;

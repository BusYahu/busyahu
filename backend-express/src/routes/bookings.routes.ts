import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
} from '../controllers/bookings.controller';

const router = Router();

// Todas las operaciones de reserva requieren autenticación JWT
router.use(verifyToken);

router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/:id', getBookingById);
router.delete('/:id', cancelBooking);

export default router;
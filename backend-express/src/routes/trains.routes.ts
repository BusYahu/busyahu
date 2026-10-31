import { Router } from 'express';
import {
  getDestinations,
  searchTrains,
  getTrainById,
  getTrainSeats,
  createTrain,
} from '../controllers/trains.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint de catálogo de países y terminales
router.get('/destinations', getDestinations);

// Catálogo completo (alias de /trains/search sin filtros) y búsqueda
router.get('/trains', searchTrains);
router.get('/trains/search', searchTrains);
router.post('/trains', verifyToken, createTrain);

// Endpoints de trenes y asientos
router.get('/trains/:id', getTrainById);
router.get('/trains/:id/seats', getTrainSeats);

export default router;

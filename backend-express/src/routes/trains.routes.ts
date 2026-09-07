import { Router } from 'express';
import { getDestinations, searchTrains, getTrainById, getTrainSeats } from '../controllers/trains.controller';

const router = Router();

// Endpoint de catálogo de países y terminales
router.get('/destinations', getDestinations);

// Endpoints de trenes y asientos
router.get('/trains/search', searchTrains);
router.get('/trains/:id', getTrainById);
router.get('/trains/:id/seats', getTrainSeats);

export default router;
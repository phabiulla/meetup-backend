import { Router } from 'express';

import authMiddleware from './app/midllewares/auth';
import multerConfig from './config/multer';
import multer from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import MeetupController from './app/controllers/MeetupController';
import SubscriptionController from './app/controllers/SubscriptionController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);
routes.put('/users', UserController.update);

routes.get('/meetups', MeetupController.index);
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:id', MeetupController.update);

routes.get('/subscriptions', SubscriptionController.index);
routes.post('/subscriptions', SubscriptionController.store);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;

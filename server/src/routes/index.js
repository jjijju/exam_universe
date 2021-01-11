import express from 'express';
import { router } from '../app';
import index from '../controllers/index';

const route = express.Router();

/* GET home page. */
router.get('/', index);

export default router;

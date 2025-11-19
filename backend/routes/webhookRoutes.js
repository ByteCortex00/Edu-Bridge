import express from 'express';
import { handleClerkWebhook } from '../controllers/webhookController.js';
import bodyParser from 'body-parser';

const router = express.Router();

// Webhook route requires raw body for signature verification
router.post(
  '/clerk',
  bodyParser.raw({ type: 'application/json' }),
  handleClerkWebhook
);

export default router;
const express = require('express');
const { verifyCredential } = require('../services/verification.service');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { credentialId } = req.body || {};

    if (!credentialId) {
      return res.status(400).json({ error: 'credentialId is required' });
    }

    const result = await verifyCredential(credentialId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get('/:credentialId', async (req, res, next) => {
  try {
    const { credentialId } = req.params;

    if (!credentialId) {
      return res.status(400).json({ error: 'credentialId is required' });
    }

    const result = await verifyCredential(credentialId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

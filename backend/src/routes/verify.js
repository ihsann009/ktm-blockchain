const express = require('express');
const { verifyCredential } = require('../services/verification.service');

const router = express.Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return UUID_REGEX.test(str);
}

router.post('/', async (req, res, next) => {
  try {
    const { credentialId } = req.body || {};

    if (!credentialId) {
      return res.status(400).json({ error: 'credentialId is required' });
    }

    if (!isValidUUID(credentialId)) {
      return res.status(400).json({ error: 'credentialId must be a valid UUID' });
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

    if (!credentialId || !isValidUUID(credentialId)) {
      return res.status(400).json({ error: 'credentialId must be a valid UUID' });
    }

    const result = await verifyCredential(credentialId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

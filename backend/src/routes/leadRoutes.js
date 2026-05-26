// Public lead-capture endpoints. POST /api/leads is open to anyone so the
// homepage and search popups can submit it. GET /api/leads/me reads the
// httpOnly `pf_lead` cookie to tell the frontend whether the visitor has
// already submitted and the advanced-search gate can be skipped.

const express = require('express');
const leadController = require('../controllers/leadController');

const router = express.Router();

router.post('/', leadController.captureLead);
router.get('/me', leadController.getMyLead);

module.exports = router;

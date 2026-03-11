const express = require('express');
const { getCountries } = require('../controllers/countries.cjs');

const router = express.Router();

router.get('/', getCountries);

module.exports = router;
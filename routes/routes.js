const router = require('express').Router();
const queries = require('../queries/queries');

router.route('/').get((req, res) => res.send('And we\'re here!'));

router.route('/movements').get(queries.getAllMovements).post(queries.uploadMovement);

router.route('/library').get(queries.getSavedMovements).post(queries.saveVidToLibrary);

router.route('/learn/:id').get(queries.getSingleMovement);

router.route('/tables').get(queries.setUpTables);

router.route('/doit').get((req, res) => res.send('This'));



module.exports = router;
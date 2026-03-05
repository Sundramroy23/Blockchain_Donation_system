const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Donor endpoints
router.post('/donor', userController.registerDonor);
router.get('/donor', userController.getDonor);


// NGO endpoints
router.post('/ngo', userController.registerNGO);
router.get('/ngo', userController.getNGO);

// Bank endpoints
router.post('/bank', userController.registerBank);
router.get('/bank', userController.getBank);

//GET Users
router.get('/allBank', userController.getAllBanks);
router.get('/allDonor', userController.getAllDonors);
router.get('/allNGO', userController.getAllNGOs);
router.get('/allNgo', userController.getAllNGOs);
router.get('/allDonors', userController.getAllDonors);
router.get('/allBanks', userController.getAllBanks);
router.post('/gov-user', userController.registerGovUser);
router.get('/gov-user', userController.getAllGovUsers);
router.post('/govUser', userController.registerGovUser);
router.get('/govUser', userController.getAllGovUsers);
router.post('/gov-users', userController.registerGovUser);
router.get('/gov-users', userController.getAllGovUsers);


module.exports = router;

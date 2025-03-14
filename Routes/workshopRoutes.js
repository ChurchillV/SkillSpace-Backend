const { createWorkshop, getWorkshopById, registerForWorkshop, getWorkshopRegistrants } = require('../Controllers/workshopController');
const { validateWorkshop } = require('../Middleware/validators');

const router = require('express').Router();

router.post("/", validateWorkshop, createWorkshop);
router.post("/register/:workshopId/", registerForWorkshop);


router.get("/:workshopId", getWorkshopById);
router.get("/registrants/:workshopId", getWorkshopRegistrants);

module.exports = router;
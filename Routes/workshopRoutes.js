const { createWorkshop, getWorkshopById, registerForWorkshop, getWorkshopRegistrants, updateWorkshop, getOrganizerWorkshops, getWorkshopByIdForUser } = require('../Controllers/workshopController');
const { validateWorkshop } = require('../Middleware/validators');

const router = require('express').Router();

router.post("/", validateWorkshop, createWorkshop);
router.post("/register/:workshopId/", registerForWorkshop);

router.get("/:workshopId", getWorkshopById);
router.get("/user/:workshopId", getWorkshopByIdForUser);
router.get("/:organizerId", getOrganizerWorkshops);
router.get("/registrants/:workshopId", getWorkshopRegistrants);

router.patch("/:workshopId", updateWorkshop);

module.exports = router;
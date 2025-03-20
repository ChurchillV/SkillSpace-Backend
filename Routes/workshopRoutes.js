const { createWorkshop, 
        getWorkshopById, 
        registerForWorkshop, 
        getWorkshopRegistrants, 
        updateWorkshop, 
        getWorkshopByIdForUser, 
        verifyAttendance, 
        getWorkshopAttendees, 
        getAllWorkshops,
        getWorkshopsByOrganizerId
    } = require('../Controllers/workshopController');
const { validateWorkshop } = require('../Middleware/validators');

const router = require('express').Router();

router.post("/", validateWorkshop, createWorkshop);
router.post("/:workshopId/register", registerForWorkshop);
router.post("/:workshopId/verify-attendance", verifyAttendance)

router.get("/", getAllWorkshops);
router.get("/:workshopId", getWorkshopById);
router.get("/:workshopId/user", getWorkshopByIdForUser);
router.get("/org/:organizerId", getWorkshopsByOrganizerId);
router.get("/:workshopId/registrants", getWorkshopRegistrants);
router.get("/:workshopId/attendees", getWorkshopAttendees);

router.patch("/:workshopId", updateWorkshop);

module.exports = router;
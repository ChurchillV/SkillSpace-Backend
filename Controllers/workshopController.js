const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

module.exports.createWorkshop = async(req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            message: "Workshop Creation Failed",
            errors: errors.array() 
        })
    };
    
    const {
        name,
        summary,
        description,
        photo,
        date,
        venue,
        isRecurring,
        isVirtual,
        meetingLink,
        chatLink,
        tags,
        organizerId,
        recurrenceDetails, // Array of recurring dates and times
    } = req.body;

    try {
        // Ensure the organizer exists
        const organizerExists = await prisma.organizer.findUnique({
            where: { id: organizerId },
        });
    
        if (!organizerExists) {
            return res.status(400).json({ message: "Organizer does not exist" });
        }
    
        // Ensure the tags exist, or create them
        const tagRecords = await Promise.all(
            tags.map(async (tagId) => {
            const tag = await prisma.tag.findUnique({ where: { id: tagId } });
            if (!tag) {
                return await prisma.tag.create({ data: { id: tagId, name: tagId } });
            }
            return tag;
            })
        );

        const workshop = await prisma.workshop.create({
            data: {
                name,
                summary,
                description,
                photo,
                date: new Date(date),
                venue,
                isRecurring: isRecurring || false,
                isVirtual: isVirtual || false,
                meetingLink,
                chatLink,
                organizer: { connect: { id: organizerId } },
                tags: {
                  connect: tags?.map((tagId) => ({ id: tagId })) || [],
                },
            }
        });

        // Handle recurring workshops
        if(isRecurring && recurrenceDetails?.length > 0) {
            const recurrenceData = recurrenceDetails.map(({ date, time, summary }) => ({
                date: new Date(date),
                time,
                summary: summary || null,
                workshopId: workshop.id,
            }));

            await prisma.recurrenceDetail.createMany({ data: recurrenceData });
        }

        res.status(201).json({
            success: true,
            message: "Workshop created successfully",
            workshop
        });

        console.log("Workshop Created successfully");

    } catch (error) {
        console.error("Error creating workshop", error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

module.exports.getWorkshopById = async(req, res) => {
    try {
        const { workshopId } = req.params;
    
        const workshop = await prisma.workshop.findUnique({
          where: { id: workshopId },
          include: {
            recurrenceDetails: true, // Fetch recurrence details
            registrants: true, // Fetch all registrations
          },
        });
    
        if (!workshop) {
          return res.status(404).json({ 
            success: false,
            message: "Workshop not found" 
        });
        }
    
        // Count number of registrations
        const numberOfRegistrations = workshop.registrants.length;
    
        res.status(200).json({ 
            succes: true,
            workshop, 
            numberOfRegistrations });
      } catch (error) {
        console.error("Error fetching workshop:", error);
        res.status(500).json({ message: "Internal server error" });
      }
}

module.exports.registerForWorkshop = async (req, res) => {
    try {
      const { workshopId } = req.params;
      const { userId, firstname, lastname, othernames, email, contact } = req.body;
  
      // Ensure the workshop exists
      const workshop = await prisma.workshop.findUnique({
        where: { id: workshopId },
      });
  
      if (!workshop) {
        return res.status(404).json({ message: "Workshop not found" });
      }
  
      let registration;
  
      if (userId) {
        // Case 1: Registered user
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
  
        // Check if already registered
        const existingRegistration = await prisma.registration.findFirst({
          where: { userId, workshopId },
        });
  
        if (existingRegistration) {
          return res.status(400).json({ message: "User already registered for this workshop" });
        }
  
        registration = await prisma.registration.create({
          data: {
            userId,
            workshopId,
          },
        });
  
      } else {
        // Case 2: Guest user (no account)
        if (!firstname || !lastname || !email || !contact) {
          return res.status(400).json({ message: "Guest details are required" });
        }
  
        registration = await prisma.registration.create({
          data: {
            firstname,
            lastname,
            othernames: othernames || null,
            email,
            contact,
            workshopId,
          },
        });
      }
  
      res.status(201).json({ message: "Registration successful", registration });
    } catch (error) {
      console.error("Error registering for workshop:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  

module.exports.getWorkshopRegistrants = async (req, res) => {
    try {
      const { workshopId } = req.params;
  
      // Ensure the workshop exists
      const workshop = await prisma.workshop.findUnique({
        where: { id: workshopId },
      });
  
      if (!workshop) {
        return res.status(404).json({ message: "Workshop not found" });
      }
  
      // Fetch registrants (both users and guests)
      const registrants = await prisma.registration.findMany({
        where: { workshopId },
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              contact: true,
            },
          },
        },
      });
  
      // Format the response to include both user-based and guest-based registrations
      const formattedRegistrants = registrants.map((registration) => ({
        id: registration.id,
        firstname: registration.user ? registration.user.firstname : registration.firstname,
        lastname: registration.user ? registration.user.lastname : registration.lastname,
        email: registration.user ? registration.user.email : registration.email,
        contact: registration.user ? registration.user.contact : registration.contact,
        registeredAs: registration.user ? "User" : "Guest",
      }));
  
      res.status(200).json({ 
        success: true,
        workshopId, 
        registrants: formattedRegistrants });
    } catch (error) {
        console.error("Error fetching registrants:", error);
        res.status(500).json({ 
            succes: false,
            message: "Internal server error" 
        });
    }
  };
  
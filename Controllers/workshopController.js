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

// For organizers fetching their own workshop
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
        res.status(500).json({ 
          success: false,
          message: "Internal server error"
        });
      }
}

module.exports.getWorkshopByIdForUser = async (req, res) => {
  try {
    const { workshopId } = req.params;

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            photo: true,
            contact: true,
            email: true
          }
        },
        recurrenceDetails: true,
        _count: {
          select: { registrants: true }
        }
      }
    });

    // console.log("Workshop: ", workshop);

    if (!workshop) {
      return res.status(404).json({ 
        success: false,
        message: "Workshop not found" 
    });
    }

    res.status(200).json({
      succes: true,
      workshop
    });

  } catch (error) {
    console.error("Error fetching workshop:", error);
        res.status(500).json({ 
          success: false,
          message: "Internal server error"
        });
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
          return res.status(400).json({ 
            success: false,
            message: "User already registered for this workshop" 
          });
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

        // In case a guest registers with existing credentials
        const existingUser = await prisma.user.findMany({ 
          where: { email, contact } 
        });

        if(existingUser) {
          return res.status(400).json({
            succes: false,
            message: "A user with this email/contact already exists"
          })
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

  module.exports.getOrganizerWorkshops = async(req, res) => {
    try {
      const { organizerId } = req.params;

      const workshops = await prisma.workshop.findMany({
        where: { organizerId },
        select: {
          id: true,
          name: true,
          summary: true,
          description: true,
          photo: true,
          date: true,
          venue: true,
          isRecurring: true,
          isVirtual: true,
          registrants: true,
          _count: {
            select: { registrants: true }
          }
        }
      });

      if(!workshops || workshops.length === 0) {
        return res.json({
          succes: true,
          message: "No workshops found",
          workshops
        });
      };

      res.status(200).json({
        message: "Workshops retrieved successfully",
        workshops,
        succes: true
      });
      
    } catch (error) {
      console.error("Error fetching workshops:", error);
      res.status(500).json({ 
        succes: false,
        message: "Internal server error" 
    });
    }
  }
  
  module.exports.updateWorkshop = async (req, res) => {
    try {
        const { workshopId } = req.params;
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
            organizerId,
            recurrenceDetails,
            tags, // Array of tag names or IDs
        } = req.body;

        // 🔹 Check if the workshop exists
        const existingWorkshop = await prisma.workshop.findUnique({
            where: { id: workshopId },
            include: { recurrenceDetails: true },
        });

        if (!existingWorkshop) {
            return res.status(404).json({ error: "Workshop not found" });
        }

        // 🔹 Ensure the organizer updating it is the one who created it
        if (existingWorkshop.organizerId !== organizerId) {
            return res.status(403).json({ error: "Unauthorized: You can only update your own workshops" });
        }

        // 🔹 Ensure organizer exists
        const existingOrganizer = await prisma.organizer.findUnique({
            where: { id: organizerId }
        });

        if (!existingOrganizer) {
            return res.status(404).json({ error: "Organizer not found" });
        }

        // 🔹 Handle tags efficiently
        let tagRecords = [];
        if (tags && Array.isArray(tags)) {
            tagRecords = await Promise.all(
                tags.map(async (tagName) => {
                    let tag = await prisma.tag.findUnique({ where: { name: tagName } });
                    if (!tag) {
                        tag = await prisma.tag.create({ data: { name: tagName } });
                    }
                    return { id: tag.id };
                })
            );
        }

        // 🔹 Prepare the update data
        const updateData = {
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
            ...(tags && { tags: { set: tagRecords } }), // Directly set new tags
        };

        // 🔹 Update workshop details
        const updatedWorkshop = await prisma.workshop.update({
            where: { id: workshopId },
            data: updateData,
            include: { tags: true }, // Ensure updated tags are returned
        });

        // 🔹 Handle recurrence details if provided
        if (recurrenceDetails && Array.isArray(recurrenceDetails)) {
            await prisma.recurrenceDetail.deleteMany({ where: { workshopId } });

            const newRecurrences = recurrenceDetails.map((detail) => ({
                date: new Date(detail.date),
                time: detail.time,
                workshopId,
            }));

            await prisma.recurrenceDetail.createMany({ data: newRecurrences });
        }

        return res.json({
            message: "Workshop updated successfully",
            workshop: updatedWorkshop,
        });
    } catch (error) {
        console.error("Error updating workshop:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.verifyAttendance = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { userId, email, contact } = req.body;

    if (!workshopId) {
      return res.status(400).json({ success: false, message: "Workshop ID is required" });
    }

    let registration;
    
    if (userId) {
      // Logged-in users: Verify by userId
      registration = await prisma.registration.findFirst({
        where: { userId, workshopId },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "No matching registration found. Please register first.",
        });
      }

      // Check if already marked as an attendee
      const existingAttendee = await prisma.attendee.findFirst({
        where: { userId, workshopId },
      });

      if (existingAttendee) {
        return res.status(400).json({ success: false, message: "User is already marked as attended" });
      }

      // Add as an attendee
      await prisma.attendee.create({
        data: { userId, workshopId },
      });

    } else if (email || contact) {
      // Guests: Verify by email or contact
      registration = await prisma.registration.findFirst({
        where: {
          workshopId,
          OR: [
            { email: email || undefined },
            { contact: contact || undefined },
          ],
        },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "No matching registration found. Please register first.",
        });
      }

      // Check if already marked as an attendee
      const existingAttendee = await prisma.attendee.findFirst({
        where: { workshopId, OR: [{ email }, { contact }] },
      });

      if (existingAttendee) {
        return res.status(400).json({ success: false, message: "Guest is already marked as attended" });
      }

      // Add as an attendee using email/contact
      await prisma.attendee.create({
        data: {
          workshopId,
          email: registration.email,
          contact: registration.contact,
        },
      });
    } else {
      return res.status(400).json({ success: false, message: "Provide user ID, email, or contact" });
    }

    res.status(200).json({
      success: true,
      message: "Attendance verified successfully",
    });

  } catch (error) {
    console.error("Error verifying attendance:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports.getWorkshopAttendees = async (req, res) => {
  try {
    const { workshopId } = req.params;

    if (!workshopId) {
      return res.status(400).json({ success: false, message: "Workshop ID is required" });
    }

    // Fetch all attendees for the workshop
    const attendees = await prisma.attendee.findMany({
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

    // Format the response to include both user-based and guest-based attendance records
    const formattedAttendees = attendees.map((attendanceRecord) => ({
      id: attendanceRecord.id,
      firstname: attendanceRecord.user ? attendanceRecord.user.firstname : attendanceRecord.firstname,
      lastname: attendanceRecord.user ? attendanceRecord.user.lastname : attendanceRecord.lastname,
      email: attendanceRecord.user ? attendanceRecord.user.email : attendanceRecord.email,
      contact: attendanceRecord.user ? attendanceRecord.user.contact : attendanceRecord.contact,
      attendedAs: attendanceRecord.user ? "User" : "Guest",
    }));

    res.status(200).json({
      success: true,
      message: "Attendees fetched successfully",
      attendees: formattedAttendees,
    });

  } catch (error) {
    console.error("Error fetching attendees:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" });
  }
};
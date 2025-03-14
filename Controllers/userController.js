const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator')

const prisma = new PrismaClient();

module.exports.createUser = async(req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ 
            message: "Account Creation Failed",
            errors: errors.array() 
        });
    }

    const { firstname, lastname, othernames, contact, email, password, interests, photo } = req.body;

    try {
         // Check if email or contact already exists
         const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { contact }]
            }
        });
    
        if (existingUser) {
            return res.status(400).json({ message: 'Email or contact already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                firstname, 
                lastname, 
                othernames, 
                contact, 
                email, 
                password: hashedPassword,
                photo: photo || null,
                interests: {
                    connect: interests?.map((interest) => ({ name: interest})) || []
                }
            }
        });

        res.status(201).json({
            message: "Account Created Successfully",
            user
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Email or contact already exists' });
          }
          console.error(error);
          res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports.createOrganizer = async(req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ 
            message: "Account Creation Failed",
            errors: errors.array() 
        });
    }

    const { 
            name, 
            description, 
            photo, 
            email, 
            contact, 
            password, 
            website, 
            workshopCategories 
        } = req.body;

    try {

        // Check if email or contact already exists
        const existingOrganizer = await prisma.organizer.findFirst({
            where: {
                OR: [{ email }, { contact }]
            }
        });
    
        if (existingOrganizer) {
            return res.status(400).json({ message: 'Email or contact already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const organizer = await prisma.organizer.create({
            data: {
                name, 
                description, 
                photo, 
                email, 
                contact, 
                password: hashedPassword,
                website: website,
                workshopCategories: {
                    connect: workshopCategories?.map(tagId => ({ id: tagId })) || []
                }
            }
        });

        res.status(201).json({
            message: "Account created successfully",
            organizer
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ 
                success: false,
                message: 'Email or contact already exists' 
            });
          }
          console.error(error);
          res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
}
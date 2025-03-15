const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateToken } = require('../Utils/generateToken');

const prisma = new PrismaClient();

module.exports.userLogin = async(req, res) => {
    const {email, password} = req.body;
    try {
        // Check for actual existing account
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if(!existingUser) {
            return res.status(404).json({
                success: false,
                message: "No user with that email/contact was found. Please try again"
            })
        };

        // console.log("Existing user:", existingUser);

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);

        if(!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        };

        const accessToken = generateToken(existingUser.id);

        return res.send({
            success: true,
            message: "Logged in successfully",
            profile: existingUser,
            accessToken
        })


    } catch (error) {
        console.error("Error logging in user", error);
        res.status(500).send({
            message: "Internal server error",
            success: false
        })
    }
}

module.exports.organizerLogin = async(req, res) => {
    const { email, password} = req.body;

    try {
        // Check for actual existing account
        const existingOrganizer = await prisma.organizer.findFirst({
            where: { email: email }
        });

        if(!existingOrganizer) {
            return res.status(404).json({
                success: false,
                message: "No user with that email/contact was found. Please try again"
            })
        };

        // console.log("Existing organizer:", existingOrganizer);

        const isPasswordValid = await bcrypt.compare(password, existingOrganizer.password);

        if(!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        };

        const accessToken = generateToken(existingOrganizer.id);

        return res.send({
            success: true,
            message: "Logged in successfully",
            profile: existingOrganizer,
            accessToken
        })


    } catch (error) {
        console.error("Error logging in organizer", error);
        res.status(500).send({
            message: "Internal server error",
            success: false
        })
    }
}
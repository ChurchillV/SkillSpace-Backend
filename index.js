const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./Routes/userRoutes');
const workshopRoutes = require('./Routes/workshopRoutes');
const authRoutes = require('./Routes/authRoutes');

const app = express();

app.use(bodyparser.json());
app.use(
    bodyparser.urlencoded({
        extended: true,
    })
);

app.use(cors());

app.use("/api/", userRoutes);
app.use("/api/workshops/", workshopRoutes);
app.use("/api/auth/", authRoutes);

app.listen(process.env.PORT, () => {
    console.log(`SkillSpace is up and running on port ${process.env.PORT}`);
})
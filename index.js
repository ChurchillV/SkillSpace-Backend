const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./Routes/userRoutes')
require('dotenv').config();

const app = express();

app.use(bodyparser.json());
app.use(
    bodyparser.urlencoded({
        extended: true,
    })
);

app.use(cors());

app.use("/api/", userRoutes);

app.listen(3001, () => {
    console.log("SkillSpace is up and running");
})
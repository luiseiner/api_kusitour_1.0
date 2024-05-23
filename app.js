const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const AWS = require('aws-sdk');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MySQL connection
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

// AWS S3 configuration
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Routes
const lugaresRouter = require('./routes/lugares');
const celebracionesRouter = require('./routes/celebraciones');
const hotelesRouter = require('./routes/hoteles');
const restaurantesRouter = require('./routes/restaurantes');
const agenciasRouter = require('./routes/agencias');

app.use('/api/lugares', lugaresRouter);
app.use('/api/celebraciones', celebracionesRouter);
app.use('/api/hoteles', hotelesRouter);
app.use('/api/restaurantes', restaurantesRouter);
app.use('/api/agencias', agenciasRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

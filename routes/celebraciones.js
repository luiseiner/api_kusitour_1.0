const express = require('express');
const router = express.Router();
const db = require('../config/db');
const s3 = require('../config/s3');
const multer = require('multer');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage() });

// Obtener todas las celebraciones
router.get('/', (req, res) => {
    db.query('SELECT * FROM Celebraciones', (err, results) => {
        if (err) {
            console.error('Error fetching celebrations: ', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Subir una imagen y agregar una celebración
router.post('/upload', upload.single('image'), (req, res) => {
    const file = req.file;
    if (!file) {
        console.error('No file uploaded');
        return res.status(400).send({ message: 'No file uploaded' });
    }

    console.log('File uploaded: ', file);

    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: Date.now() + path.extname(file.originalname),
        Body: file.buffer,
        ACL: 'public-read'
    };

    s3.upload(params, (err, data) => {
        if (err) {
            console.error('Error uploading to S3: ', err);
            return res.status(500).send(err);
        }

        const { id, nombre, provincia, descripcion, horario, fecha, ubicacion_url } = req.body;
        const imagen_url = data.Location;

        const sql = 'INSERT INTO Celebraciones (id, Nombre, Provincia, Descripcion, Horario, Fecha, Ubicacion_URL, Imagen_URL) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [id, nombre, provincia, descripcion, horario, fecha, ubicacion_url, imagen_url], (err, result) => {
            if (err) {
                console.error('Error inserting into database: ', err);
                return res.status(500).send(err);
            }
            res.json({ message: 'Celebración agregada con éxito', id: result.insertId });
        });
    });
});

// Editar una celebración
router.put('/:id', upload.single('image'), (req, res) => {
    const id = req.params.id;
    const file = req.file;

    let updateQuery;
    let queryParams;

    if (file) {
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: Date.now() + path.extname(file.originalname),
            Body: file.buffer,
            ACL: 'public-read'
        };

        s3.upload(params, (err, data) => {
            if (err) {
                console.error('Error uploading to S3: ', err);
                return res.status(500).send(err);
            }

            const imagen_url = data.Location;
            const { nombre, provincia, descripcion, horario, fecha, ubicacion_url } = req.body;

            updateQuery = 'UPDATE Celebraciones SET Nombre = ?, Provincia = ?, Descripcion = ?, Horario = ?, Fecha = ?, Ubicacion_URL = ?, Imagen_URL = ? WHERE id = ?';
            queryParams = [nombre, provincia, descripcion, horario, fecha, ubicacion_url, imagen_url, id];

            db.query(updateQuery, queryParams, (err, result) => {
                if (err) {
                    console.error('Error updating database: ', err);
                    return res.status(500).send(err);
                }
                res.json({ message: 'Celebración actualizada con éxito' });
            });
        });
    } else {
        const { nombre, provincia, descripcion, horario, fecha, ubicacion_url } = req.body;

        updateQuery = 'UPDATE Celebraciones SET Nombre = ?, Provincia = ?, Descripcion = ?, Horario = ?, Fecha = ?, Ubicacion_URL = ? WHERE id = ?';
        queryParams = [nombre, provincia, descripcion, horario, fecha, ubicacion_url, id];

        db.query(updateQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error updating database: ', err);
                return res.status(500).send(err);
            }
            res.json({ message: 'Celebración actualizada con éxito' });
        });
    }
});

// Eliminar una celebración
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    const sql = 'DELETE FROM Celebraciones WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting from database: ', err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Celebración eliminada con éxito' });
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const s3 = require('../config/s3');
const multer = require('multer');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage() });

// Obtener todos los hoteles
router.get('/', (req, res) => {
    db.query('SELECT * FROM Hoteles', (err, results) => {
        if (err) {
            console.error('Error fetching hotels: ', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Subir una imagen y agregar un hotel
router.post('/upload', upload.single('image'), (req, res) => {
    const file = req.file;
    if (!file) {
        console.error('No file uploaded');
        return res.status(400).send({ message: 'No file uploaded' });
    }

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

        const { id, nombre, provincia, costo, habitaciones, bano, garaje, tamano, mensaje, llamada, ubicacion_url, redes } = req.body;
        const imagen_url = data.Location;

        const sql = 'INSERT INTO Hoteles (id, Nombre, Provincia, Costo, Habitaciones, Bano, Garaje, Tamano, Mensaje, Llamada, Ubicacion_URL, Redes, Imagen_URL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [id, nombre, provincia, costo, habitaciones, bano, garaje, tamano, mensaje, llamada, ubicacion_url, redes, imagen_url], (err, result) => {
            if (err) {
                console.error('Error inserting into database: ', err);
                return res.status(500).send(err);
            }
            res.json({ message: 'Hotel agregado con éxito', id: result.insertId });
        });
    });
});

// Editar un hotel
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
            const { nombre, provincia, costo, habitaciones, bano, garaje, tamano, mensaje, llamada, ubicacion_url, redes } = req.body;

            updateQuery = 'UPDATE Hoteles SET Nombre = ?, Provincia = ?, Costo = ?, Habitaciones = ?, Bano = ?, Garaje = ?, Tamano = ?, Mensaje = ?, Llamada = ?, Ubicacion_URL = ?, Redes = ?, Imagen_URL = ? WHERE id = ?';
            queryParams = [nombre, provincia, costo, habitaciones, bano, garaje, tamano, mensaje, llamada, ubicacion_url, redes, imagen_url, id];

            db.query(updateQuery, queryParams, (err, result) => {
                if (err) {
                    console.error('Error updating database: ', err);
                    return res.status(500).send(err);
                }
                res.json({ message: 'Hotel actualizado con éxito' });
            });
        });
    } else {
        const { nombre, provincia, costo, habitaciones, bano, garaje, tamano, mensaje, llamada, ubicacion_url, redes } = req.body;

        updateQuery = 'UPDATE Hoteles SET Nombre = ?, Provincia = ?, Costo = ?, Habitaciones = ?, Bano = ?, Garaje = ?, Tamano = ?, Mensaje = ?, Llamada = ?, Ubicacion_URL = ?, Redes = ? WHERE id = ?';
        queryParams = [nombre, provincia, costo, habitaciones, bano, garaje, tamano, mensaje, llamada, ubicacion_url, redes, id];

        db.query(updateQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error updating database: ', err);
                return res.status(500).send(err);
            }
            res.json({ message: 'Hotel actualizado con éxito' });
        });
    }
});

// Eliminar un hotel
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    const sql = 'DELETE FROM Hoteles WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting from database: ', err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Hotel eliminado con éxito' });
    });
});

module.exports = router;

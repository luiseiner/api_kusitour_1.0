const express = require('express');
const router = express.Router();
const db = require('../config/db');
const s3 = require('../config/s3');
const multer = require('multer');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage() });

// Obtener todos los lugares turísticos
router.get('/', (req, res) => {
    db.query('SELECT * FROM Lugares_Turisticos', (err, results) => {
        if (err) {
            console.error('Error fetching places: ', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Subir una imagen y agregar un lugar turístico
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

        const { id, nombre, provincia, descripcion, horario, fecha_de_fundacion, ubicacion_url } = req.body;
        const imagen_url = data.Location;

        const sql = 'INSERT INTO Lugares_Turisticos (id, Nombre, Provincia, Descripcion, Horario, Fecha_de_Fundacion, Ubicacion_URL, Imagen_URL) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [id, nombre, provincia, descripcion, horario, fecha_de_fundacion, ubicacion_url, imagen_url], (err, result) => {
            if (err) {
                console.error('Error inserting into database: ', err);
                return res.status(500).send(err);
            }
            res.json({ message: 'Lugar turístico agregado con éxito', id: result.insertId });
        });
    });
});

// Editar un lugar turístico
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
            const { nombre, provincia, descripcion, horario, fecha_de_fundacion, ubicacion_url } = req.body;

            updateQuery = 'UPDATE Lugares_Turisticos SET Nombre = ?, Provincia = ?, Descripcion = ?, Horario = ?, Fecha_de_Fundacion = ?, Ubicacion_URL = ?, Imagen_URL = ? WHERE id = ?';
            queryParams = [nombre, provincia, descripcion, horario, fecha_de_fundacion, ubicacion_url, imagen_url, id];

            db.query(updateQuery, queryParams, (err, result) => {
                if (err) {
                    console.error('Error updating database: ', err);
                    return res.status(500).send(err);
                }
                res.json({ message: 'Lugar turístico actualizado con éxito' });
            });
        });
    } else {
        const { nombre, provincia, descripcion, horario, fecha_de_fundacion, ubicacion_url } = req.body;

        updateQuery = 'UPDATE Lugares_Turisticos SET Nombre = ?, Provincia = ?, Descripcion = ?, Horario = ?, Fecha_de_Fundacion = ?, Ubicacion_URL = ? WHERE id = ?';
        queryParams = [nombre, provincia, descripcion, horario, fecha_de_fundacion, ubicacion_url, id];

        db.query(updateQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error updating database: ', err);
                return res.status(500).send(err);
            }
            res.json({ message: 'Lugar turístico actualizado con éxito' });
        });
    }
});

// Eliminar un lugar turístico
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    const sql = 'DELETE FROM Lugares_Turisticos WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting from database: ', err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Lugar turístico eliminado con éxito' });
    });
});

module.exports = router;

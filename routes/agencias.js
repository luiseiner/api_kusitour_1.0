const express = require('express');
const router = express.Router();
const db = require('../config/db');
const s3 = require('../config/s3');
const multer = require('multer');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage() });

// Obtener todas las agencias
router.get('/', (req, res) => {
    db.query('SELECT * FROM Agencias', (err, results) => {
        if (err) {
            console.error('Error fetching agencies: ', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Subir una imagen y agregar una agencia
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

        const { id, nombre, provincia, email, llamada, pagina_web, redes } = req.body;
        const imagen_url = data.Location;

        const sql = 'INSERT INTO Agencias (id, Nombre, Provincia, Email, Llamada, Pagina_Web, Redes, Imagen_URL) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [id, nombre, provincia, email, llamada, pagina_web, redes, imagen_url], (err, result) => {
            if (err) {
                console.error('Error inserting into database: ', err);
                return res.status(500).send(err);
            }
            res.json({ message: 'Agencia agregada con éxito', id: result.insertId });
        });
    });
});

// Editar una agencia
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
            const { nombre, provincia, email, llamada, pagina_web, redes } = req.body;

            updateQuery = 'UPDATE Agencias SET Nombre = ?, Provincia = ?, Email = ?, Llamada = ?, Pagina_Web = ?, Redes = ?, Imagen_URL = ? WHERE id = ?';
            queryParams = [nombre, provincia, email, llamada, pagina_web, redes, imagen_url, id];

            db.query(updateQuery, queryParams, (err, result) => {
                if (err) {
                    console.error('Error updating database: ', err);
                    return res.status(500).send(err);
                }
                res.json({ message: 'Agencia actualizada con éxito' });
            });
        });
    } else {
        const { nombre, provincia, email, llamada, pagina_web, redes } = req.body;

        updateQuery = 'UPDATE Agencias SET Nombre = ?, Provincia = ?, Email = ?, Llamada = ?, Pagina_Web = ?, Redes = ? WHERE id = ?';
        queryParams = [nombre, provincia, email, llamada, pagina_web, redes, id];

        db.query(updateQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error updating database: ', err);
                return res.status(500).send(err);
            }
            res.json({ message: 'Agencia actualizada con éxito' });
        });
    }
});

// Eliminar una agencia
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    const sql = 'DELETE FROM Agencias WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting from database: ', err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Agencia eliminada con éxito' });
    });
});

module.exports = router;

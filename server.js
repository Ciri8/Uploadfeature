import formidable from 'formidable';
import http from 'http';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import * as fastcsv from 'fast-csv';

const { Client } = pkg;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.csv': 'text/csv', 
    '.xls': 'application/vnd.ms-excel', 
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
};

const uploadDir = path.join(process.cwd(), 'uploads');

// Initialize PostgreSQL client and connect
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Kadmiry01',
  database: 'uploaddb'
});

client.connect(err => {
  if (err) {
    console.error('connection error', err.stack);
    process.exit(1); // Exit the process with a failure code (1)
  } else {
    console.log('connected');
  }
});

fs.access(uploadDir, fs.constants.F_OK, (err) => {
    if (err) {
        console.log('Uploads directory does not exist. Creating...');
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
            if (err) throw err;
            console.log('Uploads directory created.');
        });
    } else {
        console.log('Uploads directory exists.');
    }
});

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        fs.readFile('./index.html', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.method === 'POST' && req.url === '/upload') {
        const form = new formidable.IncomingForm();
        form.uploadDir = uploadDir;
        form.keepExtensions = true;
        form.maxFileSize = 50 * 1024 * 1024; // 50MB

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            const filePath = files.file.path;

            // Insert the CSV file data into the database
            fs.createReadStream(filePath)
                .pipe(fastcsv.parse({ headers: true }))
                .on('data', row => {
                    client.query('INSERT INTO uptable (pregnancies, glucose, bloodpressure, skinthickness, insulin, bmi, diabetespedigreefunction, age, outcome) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [row.Pregnancies, row.Glucose, row.BloodPressure, row.SkinThickness, row.Insulin, row.BMI, row.DiabetesPedigreeFunction, row.Age, row.Outcome], (err, res) => {
                        if (err) {
                            console.error(err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                            return;
                        }
                    });
                })
                .on('end', () => {
                    console.log('CSV file successfully processed');
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('File uploaded and data inserted into database successfully');
                })
                .on('error', err => {
                    console.error(err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                });
        });
    } else if (req.method === 'GET') {
        const filePath = '.' + req.url;
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

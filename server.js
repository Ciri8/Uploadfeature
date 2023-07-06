import Formidable from 'formidable';
import http from 'http';
import fs from 'fs';
import path from 'path';
import * as fastcsv from 'fast-csv';
import pkg from 'pg';
import format from 'pg-format';

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
        const form = Formidable({
            multiples: true,
            uploadDir: uploadDir,
            keepExtensions: true,
            maxFileSize: 50 * 1024 * 1024 // 50MB
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
        
            console.log("File uploaded: ", files.file.path);
        
            // Create a unique table name using the filename (without extension)
            const tableName = path.parse(files.file.name).name;
        
            // Read the CSV file data and extract headers
            let headers;
            fs.createReadStream(files.file.path)
                .pipe(fastcsv.parse({ headers: true }))
                .on('data', row => {
                    if (!headers) {
                        headers = Object.keys(row);
        
                        // Create a new table based on the CSV file headers if it doesn't exist
                        const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${headers.map(name => `${name} TEXT`).join(', ')})`;
                        client.query(createTableQuery, (err, res) => {
                            if (err) {
                                console.error('Error creating table:', err);
                            } else {
                                console.log('Table created successfully');
                            }
                        });
                    }
                })
                .on('end', () => {
                    console.log('CSV header processing ended');
        
                    // Insert the CSV file data into the new table
                    fs.createReadStream(files.file.path)
                        .pipe(fastcsv.parse({ headers: true }))
                        .on('data', row => {
                            console.log('CSV row:', row);
                            const values = Object.values(row);
        
                            // Insert the CSV file data into the new table
                            const placeholders = headers.map((_, i) => `$${i + 1}`).join(',');
                            const insertDataQuery = `INSERT INTO ${tableName} (${headers.join(',')}) VALUES (${placeholders})`;
                            client.query(insertDataQuery, values, (err, res) => {
                                if (err) {
                                    console.error('Error inserting data:', err);
                                } else {
                                    console.log('Data inserted successfully');
                                }
                            });
                        })
                        .on('end', async () => {
                            console.log('CSV processing ended');
        
                            const checkTableQuery = `SELECT to_regclass('public.${tableName}');`;
                            const { rows } = await client.query(checkTableQuery);
                            if (rows[0].to_regclass !== null) {
                                console.log('Table exists in the database');
                            } else {
                                console.log('Table does not exist in the database');
                            }
                        });
                });
        });
        
        
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('File uploaded and processed.');
    } else {
        // Assume the request is for a static file
        const filePath = path.join(process.cwd(), req.url);
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error occurred: could not find the file');
            } else {
                const ext = path.extname(filePath);
                const contentType = mimeTypes[ext] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});

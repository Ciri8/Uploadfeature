import formidable from 'formidable';
import http from 'http';
import fs from 'fs';
import path from 'path';

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.csv': 'text/csv', // Added MIME type for CSV files
    '.xls': 'application/vnd.ms-excel', // Added MIME type for Excel 97-2003 Workbook files
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Added MIME type for Excel Workbook files

};

const uploadDir = path.join(process.cwd(), 'uploads');

// Check if the directory exists
fs.access(uploadDir, fs.constants.F_OK, (err) => {
    // If the directory doesn't exist, create it
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
        form.maxFileSize = 50 * 1024 * 1024;
        

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('File uploaded successfully');
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

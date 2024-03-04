// Http server
// Template from https://expressjs.com/en/starter/hello-world.html
// Serving an HTML Page From a File
// http://public ip/hash
// parse all requests
// check the hash in request against the files we are serving
// send a response back with the file

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// requests should always be sent to root, with the hash data inside req.body 
app.get('/([a-z]|[a-z]|[0-9])*/', (req, res) => {
    const directoryPath = './http_server_files';
    correctHash = req.url.slice(1);
    // compare that hash with the hashes of our files
    fs.readdir(directoryPath, (err, files) => {
        for (const file of files) {
            console.log("ran");
            const filePath = path.join(__dirname, directoryPath, file);
            const fileContent = fs.readFileSync(filePath);
            const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            
            if (fileHash == correctHash) {
                res.sendFile(filePath, (err) => {
                    if (err) {
                        console.log("Couldn't send file at: " + filePath);
                        console.log(err, err.status);
                        return res.status(err.status).end();
                    }
                    else {
                        console.log("Sent file at: " + filePath);
                        return res.status(200).end();
                    }
                });
                return;
            }
        }
        res.status(404).send('File not found. HELLO');
    });
});

// CODE FOR TESTING
// app.get('/', (req, res) => {
//     const directoryPath = './http_server_files';
//     fs.readdir(directoryPath, (err, files) => {
//         for (const file of files) {
//             const filePath = path.join(directoryPath, file);
//             const fileContent = fs.readFileSync(filePath);
//             const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
//             console.log(fileHash, filePath);
//         }
//     })
// });


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

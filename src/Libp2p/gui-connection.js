// Setting up a websocket to exchange with the gui
import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

export default function connectToGUI() {
    const ws = new WebSocketServer({ port: 5174 }) // Server
    // const ws = new WebSocket('ws://localhost:5174'); // Client

    console.log("Now opening up websocket connection to GUI...")
    // When a client connects to the WebSocket server
    ws.on('connection', (ws) => {
        console.log('Client connected');

        // Handle requests from the GUI 
        ws.on('message', (message) => {
            console.log('Request: ', message.toString());
            if (message.toString() === 'GET_DATA') {
                console.log("received GET request")
                // If the message is 'GET_DATA', send the peer node information to the client
                console.log(discoveredPeers === local_peer_node_info.peerID)
                const ipRegex = /\/ip4\/([^\s/]+)/;
                const match = getMultiaddrs(test_node2)[1].match(ipRegex);
                const ipAddress = match && match[1];

                const portRegex = "//tcp/(\d+)/";
                const match2 = getMultiaddrs(test_node2)[1].match(portRegex);
                const portNumber = match2 && match2[1];
                let thing = null;
                // TODO: Update this peer id as needed
                discoveredPeers.forEach((peer) => {
                    // console.log(peer)
                    if(peer.location != null && peer.location.city != null && peer.location.city === 'Singapore') {
                        thing = peer;
                    }
                })
                
                const peerInfo = findPeerInfoByPeerId(discoveredPeers, "12D3KooWSXZGdoTXPaXS7SzrA1oN1BoYLByn9KghndmC1aV2s7hZ"); 
                const peerNodeInfo = {
                // Example peer node information
                id: thing.peerId, 
                address: "128.199.237.234",
                port: "96",
                location: thing.location
                };
        
                // Convert the peer node information to JSON and send it back to the client
                // ws.send(JSON.stringify(peerNodeInfo));
                // Send response with header type NODE_INFO
                ws.send(JSON.stringify({ type: 'NODE_INFO', data: peerNodeInfo }));
            }

            // if (parsedData.type === 'NODE_INFO') {
        });
        // Send a welcome message to the client
        ws.send('Welcome to the WebSocket server!');
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
}

// Http API for GUI
// http://localhost/hash
// parse all requests
// check the hash in request against the files we are serving
// send a response back with the file

import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { requestFileFromProducer, payChunk, sendFileToConsumer, registerFile, getProducers } from './app.js';
import { fileRequests, getPublicMultiaddr } from './utils.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const destinationDirectory = path.join(__dirname, '..', 'testProducerFiles')
const MAX_CHUNK_SIZE = 63000;


export function createHTTPGUI(node) {
    const app = express();
    // Middleware to parse JSON bodies
    app.use(express.json());

    app.post('/requestFileFromProducer/', async (req, res) => {
        let statusCode = 200; 
        let { prodIp, prodPort, prodId, fileHash } = req.body;
        prodIp = String(prodIp);
        prodPort = String(prodPort);
        prodId = String(prodId);
        fileHash = String(fileHash);

        const ret = await requestFileFromProducer(node, prodIp, prodPort, prodId, fileHash)
        if (!ret) {statusCode = 400;}
        res.status(statusCode).send();
    });

    app.get('/viewFileRequests/', async (req, res) => {
        let statusCode = 200; 
        
        res.status(statusCode).send(fileRequests);
    });

    //cli command 9
    app.post('/sendFileToConsumer/', async (req, res) =>{
        let statusCode = 200;
        const {addr, fileHash, price} = req.body;
        try {
            await sendFileToConsumer(node, addr, fileHash, price);
        } catch (error) {
            console.error("Error sending file to consumer:", error);
            statusCode = 500;
        }
        res.status(statusCode).send();
    });

    //cli command 10
    app.post('/payChunk', async (req, res) => {
        let statusCode = 200;
        const { addr, amount } = req.body;
        try {
            await payChunk(node, addr, amount);
        } catch (error) {
            console.error("Error paying for chunk:", error);
            statusCode = 500;
        }
        res.status(statusCode).send();
    });

    //cli command 11
    app.post('/registerFile', async (req, res) => {
        let statusCode = 200;
        const {fileName, username, price} = req.body;
        const peerId = node.peerId.toString();
        const publicMulti = await getPublicMultiaddr(node);
        const parts = publicMulti.split('/')
        const publicIP = parts[1]
        const port = parts[3]

        try {
            await registerFile(fileName, peerId, username, publicIP, port, price);
        } catch (error) {
            console.error("Error registering file:", error);
            statusCode = 500;
        }
        res.status(statusCode).send();
    });

    //cli command 12
    app.get('/getProducersWithFile', async (req, res) =>{
        let statusCode = 200;
        let message = '';
        const { fileHash } = req.body;
        try {
           message = await getProducers(fileHash);
        } catch (error) {
            statusCode = 500;
            message = "Error getting producers with the filehash " + fileHash + ": " + error;
        }

        res.status(statusCode).send(message);
    });

    //cli command 13
    app.get('/hashFile', async (req, res) =>{
        let statusCode = 200; 
        let message = '';
        let { filePath } = req.query;

        if (!fs.existsSync(filePath)) {
            statusCode = 400;
            message = 'File not found';
        } else {
            const fileContent = fs.readFileSync(filePath);
            const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            message = {fileHash};
        }
        
        res.status(statusCode).send(message);
    });
    
    app.post('/uploadFile', async (req, res) => {
        let statusCode = 200; 
        let message = 'Success';
        let { filePath } = req.body;

        if (!fs.existsSync(filePath)) {
            statusCode = 400;
            message = 'File not found';
        }
        const fileName = path.basename(filePath);
        const destinationPath = path.join(destinationDirectory, fileName);
        fs.copyFile(filePath, destinationPath, (error) => {
            if (error) {
                statusCode = 400;
                message = 'File copy unsuccessful';
            }
        });
        res.status(statusCode).send(message);
    });

    app.post('/deleteFile', async (req, res) => {
        let statusCode = 200; 
        let message = 'Success';
        let { filePath } = req.body;

        if (!fs.existsSync(filePath)) {
            statusCode = 400;
            message = 'File not found';
        }
        // Asynchronously delete the file
        fs.unlink(filePath, (error) => {
            if (error) {
                statusCode = 400;
                message = 'Error deleting file';
            }
        });
        res.status(statusCode).send(message);
    });
    
    app.get('/getFileInfo', async (req, res) => {
        let statusCode = 200; 
        let message = '';
        let { filePath } = req.query;

        if (!fs.existsSync(filePath)) {
            statusCode = 400;
            message = 'File not found';
        } else {
            const fileName = path.basename(filePath);
            const fileStats = fs.statSync(filePath);
            const fileSize = fileStats.size;
            const numberChunks =  Math.ceil(fileSize / MAX_CHUNK_SIZE);
            const fileDate = fileStats.birthtime;
            const fileContent = fs.readFileSync(filePath);
            const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
    
            message = {
                fileName,
                filePath,
                fileDate,
                fileSize,
                numberChunks,
                fileHash
            };
        }
        
        res.status(statusCode).send(message);
    });

    app.get('/getProducerFilesInfo', async (req, res) => {
        let statusCode = 200; 
        let message = [];

        const files = fs.readdirSync(destinationDirectory);
        files.forEach(file => {
            const filePath = path.join(destinationDirectory, file);
            const fileName = path.basename(filePath);
            const fileStats = fs.statSync(filePath);
            const fileSize = fileStats.size;
            const numberChunks =  Math.ceil(fileSize / MAX_CHUNK_SIZE);
            const fileDate = fileStats.birthtime;
            const fileContent = fs.readFileSync(filePath);
            const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
    
            message.push({
                fileName,
                filePath,
                fileDate,
                fileSize,
                numberChunks,
                fileHash
            })
        })
        res.status(statusCode).send(message);
    })


    //cli command 10


    const server = app.listen()
    console.log(`HTTP GUI API is running on port ${server.address().port}`);
    return server;
}
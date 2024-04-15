import { recievedPayment, getPublicMultiaddr } from './utils.js';
import { multiaddr } from 'multiaddr'
import { payForChunk, sendRequestFile, uploadFile } from './protocol.js';
import { Consumer } from '../Producer_Consumer/consumer.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'node:fs';
import crypto from 'crypto';
import { Producer } from '../Producer_Consumer/producer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const producerFilesPath = join(__dirname, '..', 'testProducerFiles');

export async function requestFileFromProducer(node, prodIp, prodPort, prodId, fileHash) {
    const curAddr = await getPublicMultiaddr(node);

    // Dial to the producer peer 
    const addr = '/ip4/' + prodIp + '/tcp/' + prodPort + '/p2p/' + prodId; 
    const producerMA = multiaddr(addr)
    try {
        const stream = await node.dialProtocol(producerMA, '/fileExchange/1.0.0');
        await sendRequestFile(stream, curAddr, fileHash);
        return true;
    } catch (err) {console.log(err); return false;}
}

export async function sendFileToConsumer(node, addr, fileHash, price) {
    try {
        let actualPath = join(producerFilesPath, fileHash);
        fs.readdir(producerFilesPath, (err, files) => {
            for (const file of files) {
                const filePath = join(producerFilesPath, file);
                const fileContent = fs.readFileSync(filePath);
                const hash = crypto.createHash('sha256').update(fileContent).digest('hex');

                if (fileHash.trim() == hash.trim()) {
                    actualPath = filePath;
                }
            }
        
            // Dial to the consumer peer 
            const consumerMA = multiaddr(addr)
            const timer = ms => new Promise( res => setTimeout(res, ms));
            const consID = addr.split('/')[addr.split('/').length-1]
            fs.readFile(actualPath, async (err, data) => {
                if (!recievedPayment.hasOwnProperty(consID)) {
                    recievedPayment[consID] = true;
                }
                
                let numChunks = 0;
                const MAX_CHUNK_SIZE = 63000;
                
                if (err) {
                    console.error('Error reading file:', err);
                    return;
                }
                numChunks = Math.ceil(data.length / MAX_CHUNK_SIZE);
                
                for (let i = 0; i < numChunks; i += 1) {
                    while (!recievedPayment[consID]) {
                        console.log('Waiting')
                        await timer(3000);
                    }
                
                    const stream = await node.dialProtocol(consumerMA, '/fileExchange/1.0.1');
                    console.log('Producer dialed to consumer on protocol: /fileExchange/1.0.1')
                    uploadFile(i, i == numChunks-1, price, stream, actualPath, node, consumerMA);
                    recievedPayment[consID] = false;
                }
            });
        })
    }catch (err) {console.log(err)}
}

export async function payChunk(node, addr, amount) {
    const producerMA = multiaddr(addr);
    try {
        const stream = await node.dialProtocol(producerMA, '/fileExchange/1.0.2');
        await payForChunk(stream, amount);
    } catch (err) {console.log(err)}
}

export function hashFile(fileName) {
    const filePath = join(producerFilesPath, fileName);
    const fileContent = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
    console.log('Filehash: ', fileHash);
}

export async function registerFile(fileName, uId, uName, uIp, uPort, price){
    const fileHash = hashFile(fileName);
    return new Promise((resolve, reject) => {
        let users = Producer.registerFile(fileHash, uId, uName, uIp, uPort, price);
        if (users !== false) resolve(users);
        else reject("Error in Producer.registerFile(). Check console.");
    });
}

export async function getProducers(fileHash) {
    return new Promise((resolve, reject) => {
        let users = Consumer.viewProducers(fileHash);
        if (users !== false) resolve(users);
        else reject("Error in Consumer.viewProducers(). Check console.");
    });
}
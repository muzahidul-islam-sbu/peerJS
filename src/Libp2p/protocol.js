import { pipe } from 'it-pipe'
import * as lp from 'it-length-prefixed'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import map from 'it-map'
import pkg from 'protobufjs';
const { load, Message } = pkg;
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileRequests } from './utils.js'

export async function handleMessage(stream) {
    let receivedData = Buffer.alloc(0); // Initialize an empty buffer to accumulate received data

    await pipe(
        stream,
        async function (source) {
            for await (const buf of source) {
                receivedData = Buffer.concat([receivedData, buf]);
            }
        }
    );

    const receivedMessage = receivedData.toString('utf8');
    console.log("Received message:", receivedMessage);
}

export async function sendMessage(stream, node, peerId, message, publicKey, addr) {
    try {
        // Convert the message to Uint8Array
        const messageUint8Array = stringToUint8Array(message);

        // Write the message to the stream
        await pipe([messageUint8Array], stream.sink);
        // await pipe(
        // [ Uint8Array.from(Buffer.from(message, 'utf-8')) ],
        // stream,
        // async function (source) {
        //     for await (const message of source) {
        //     console.info(`Me: ${String.fromCharCode.apply(null, message)}`);
        //     }
        // }
        // );

        console.log(`Sent message to ${peerId}:`, message);

        // await node.hangUp(addr);
    } catch (error) {
        console.error(`Failed to send message to ${peerId}:`, error);
    }
}

function stringToUint8Array(str) {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return new Uint8Array(buf);
}

export async function sendRequestFile(stream, curAddr, fileHash) {
    await pipe(
        [curAddr + ' ' + fileHash],
        // Turn strings into buffers
        (source) => map(source, (string) => uint8ArrayFromString(string)),
        // Encode with length prefix (so receiving side knows how much data is coming)
        (source) => lp.encode(source),
        stream.sink
    );
    console.log('Requested file');
    await stream.close();
}

export async function handleRequestFile({ stream }) {
    await pipe(
        stream.source,
        // Decode length-prefixed data
        (source) => lp.decode(source),
        // Turn buffers into strings
        (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
        async function (source) {
            for await (var message of source) {
                const [addr, fileHash] = message.split(' ')
                fileRequests.push({addr, fileHash})
                console.log('Requesting: ' + message)
            }
        }
    )
    await stream.close();
}

export function uploadFile(ind, isLastChunk, price, stream, filePath, node, addr) {
    const MAX_CHUNK_SIZE = 63000; // Maximum chunk size
    // Read utf-8 from stdin
    load("./protos/file.proto", function (err, root) {
        if (err) throw err;

        const FileData = root.lookupType("package.FileData");
        const fileName = path.basename(filePath);
        //console.log('filepath:', filePath);


        fs.readFile(filePath, async (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }
            const chunk = data.subarray(ind * MAX_CHUNK_SIZE, (ind * MAX_CHUNK_SIZE) + MAX_CHUNK_SIZE);
            let message = FileData.create({
                filename: fileName,
                data: chunk,
                isLastChunk: isLastChunk,
                price: price
            })
            //console.log('filename:', fileName);
            let buffer = FileData.encode(message).finish();
            console.log(typeof buffer, buffer);
            // console.log(FileData.decode(buffer))
            await pipe(
                [buffer],
                stream,
                async function (source) {
                    for await (const message of source) {
                        console.info(`Me: ${String(message)}`)
                    }
                }
            )
            console.log('piped')
            await node.hangUp(addr);
        })
    })
}

export async function handleDownloadFile(stream, connection, bufferedFiles, emitter) {
    console.log('Downloading File')
    load("./protos/file.proto", async function (err, root) {
        if (err) throw err;

        const FileData = root.lookupType("package.FileData");
        // let receivedData = Buffer.alloc(0); // Initialize an empty buffer to accumulate received data

        await pipe(
            stream,
            async function (source) {
                for await (const message of source) {
                    for await (const buffer of message) {

                        console.log('buffer: ', buffer, FileData.decode(buffer));
                        let fileName = FileData.decode(buffer)['filename'];
                        let isLastChunk = FileData.decode(buffer)['isLastChunk']
                        let data = FileData.decode(buffer)['data']
                        let price = FileData.decode(buffer)['price']

                        emitter.emit('receivedChunk', price, connection.remoteAddr)

                        if (!bufferedFiles.hasOwnProperty(fileName)) {
                            bufferedFiles[fileName] = Buffer.alloc(0);
                        }
                        bufferedFiles[fileName] = Buffer.concat([bufferedFiles[fileName], data]);

                        if (isLastChunk) {
                            console.log("data: ", bufferedFiles[fileName]);
                            // Decode the received data
                            const fileData = bufferedFiles[fileName]

                            // Write the file data to disk
                            const filePath = path.join('./testConsumerFiles/', fileName);
                            const directory = path.dirname(filePath);
                            if (!fs.existsSync(directory)) {
                                fs.mkdirSync(directory, { recursive: true });
                            }
                            fs.writeFile(filePath, fileData, (err) => {
                                if (err) {
                                    console.error('Error saving file:', err);
                                    return;
                                }
                                console.log('File saved successfully:', filePath);
                            });
                        }
                    }
                }
            }
        );
    });
}

export async function payForChunk(stream, price) {
    console.log('Consumer dialed to producer on protocol: /fileExchange/1.0.2')
    await pipe(
        [price.toString()], 
        // Turn strings into buffers
        (source) => map(source, (string) => uint8ArrayFromString(string)),
        // Encode with length prefix (so receiving side knows how much data is coming)
        (source) => lp.encode(source),
        stream.sink
    );
    await stream.close();
    console.log('Paid: ', price);
}

export async function handlePayForChunk(connection, stream, recievedPayment) {
    const consID = connection.remotePeer.toString()
    await pipe(
        stream.source,
        // Decode length-prefixed data
        (source) => lp.decode(source),
        // Turn buffers into strings
        (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
        async function(source) {
            for await (const message of source) {console.log('Recieved Payment: ', message);}
        }
    )
    recievedPayment[consID] = true;
}

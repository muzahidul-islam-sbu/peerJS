import { pipe } from 'it-pipe'

export async function handleMessage(stream) {
    let receivedData = Buffer.alloc(0); // Initialize an empty buffer to accumulate received data

    await pipe(
        stream,
        async function(source) {
            for await (const buf of source) {
                receivedData = Buffer.concat([receivedData, buf]);
            }
        }
    );

    const receivedMessage = receivedData.toString('utf8');
    console.log("Received message:", receivedMessage);
}

export async function sendMessage(stream, node, peerId, message) {
    try {
        // Convert the message to Uint8Array
        const messageUint8Array = stringToUint8Array(message);

        // Write the message to the stream
        await pipe([messageUint8Array], stream.sink);

        console.log(`Sent message to ${peerId}:`, message);
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
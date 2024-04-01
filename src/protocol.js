import { pipe } from 'it-pipe'

export async function handleMessage(stream) {
    // Handle incoming message for your protocol
    let receivedData = Buffer.alloc(0); // Initialize an empty buffer to accumulate received data

    await pipe(
        stream,
        async function(source) {
            for await (const buffer of source) {
              for await (const buf of buffer){
                console.log('buffer: ', buf);
                receivedData = Buffer.concat([receivedData, buf]);
              }
            }
        }
    );
    console.log("data: ", receivedData);
};

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
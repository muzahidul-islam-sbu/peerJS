import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import { mdns } from '@libp2p/mdns';
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

const options = {
    emitSelf: true, // Example: Emit to self on publish
    gossipIncoming: true, // Example: Automatically gossip incoming messages
    fallbackToFloodsub: true, // Example: Fallback to floodsub if gossipsub is not supported
    floodPublish: true, // Example: Send self-published messages to all peers
    doPX: false, // Example: Enable PX
    // msgIdFn: (message) => message.from + message.seqno.toString('hex'), // Example: Custom message ID function
    signMessages: true // Example: Sign outgoing messages
}

// Function to handle incoming messages for the custom protocol
const handleCustomProtocolMessage = (peerId, message) => {
    console.log(message)
    console.log(`Received message from ${peerId}:`, message.toString());
};

const node = await createLibp2p({
    addresses: {
        // add a listen address (localhost) to accept TCP connections on a random port
        listen: ['/ip4/0.0.0.0/tcp/0']
    },
    transports: [
        tcp()
    ],
    streamMuxers: [
        yamux()
    ],
    connectionEncryption: [
        noise()
    ],
    peerDiscovery: [
        mdns()
    ],
    services: {
        pubsub: gossipsub(options)
    }
});

await node.start();
console.log('node has started:', node.peerId);
  
node.services.pubsub.start()
node.services.pubsub.subscribe('transaction')
node.services.pubsub.addEventListener('message', (message) => {
    console.log("Event listener for subscribing works!")
    console.log(`${message.detail.topic}:`, new TextDecoder().decode(message.detail.data))
})
node.services.pubsub.publish('transaction', new TextEncoder().encode('123456789'))

node.addEventListener('peer:connect', (evt) => {
    const peerId = evt.detail;
    console.log('\nConnected Peer with PeerId: ', peerId);
});

// node.handle('/protocol/1.0.0', ({ stream }) => {
//     console.log('Receiving Message')
//     handleMesage(stream);
// })


// Protocol ID for the custom protocol
const CUSTOM_PROTOCOL_ID = '/protocol/1.0.0';

// Register protocol handlers with libp2p node
node.handle(CUSTOM_PROTOCOL_ID, ({ stream }) => {
    console.log("hello")

    // Handle incoming connections for the custom protocol
    // stream.on('data', (data) => {
    //     console.log(data)
    //     // Assuming data is a buffer, you can convert it to a string if needed
    //     const message = uint8ArrayToString(data);
        
    //     // Log the incoming message
    //     console.log(`Received message: ${message}`);
        
    //     // Further processing of the incoming message
    //     // handleCustomProtocolMessage(stream.remotePeer, data);

    // });
    // Use the pipe function to handle incoming data on the stream

    let receivedData = Buffer.alloc(0);
    pipe(
        stream,
        async function(source) {
            for await (const buffer of source) {
                console.log('Received buffer:', buffer); // Add this log statement
                console.log(receivedData)
                // Concatenate the received buffer to the existing data
                receivedData = Buffer.concat([receivedData, buffer]);
                console.log(receivedData)
            }
        }
    ).catch((err) => {
        console.error(`Error on stream: ${err.message}`);
    });

    // Handle stream closure
    stream.on('close', () => {
        console.log(`Stream with peer ${stream.remotePeer} closed`);
    });
    // Handle stream errors
    stream.on('error', (err) => {
        console.error(`Error on stream with peer ${stream.remotePeer}: ${err.message}`);
    });
});

// Peer ID of the peer you want to connect to
// const peerId = '...'; // Replace '...' with the actual peer ID

// // Establish a communication channel with the specified peer using the custom protocol
// const { stream } = await node.dialProtocol(peerId, CUSTOM_PROTOCOL_ID);

// Write a message to the stream (sending a message to the specified peer)
// stream.write(Buffer.from('Hello from the sender'));
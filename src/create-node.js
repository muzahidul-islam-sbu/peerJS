import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import {mdns} from '@libp2p/mdns';

// Function to handle incoming messages for the custom protocol
const handleCustomProtocolMessage = (peerId, message) => {
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
    ]
});

await node.start();
console.log('node has started:', node.peerId);

// Protocol ID for the custom protocol
const CUSTOM_PROTOCOL_ID = '/chat/1.0.0';

// Register protocol handlers with libp2p node
node.handle(CUSTOM_PROTOCOL_ID, ({ stream, protocol }) => {
    console.log(`Received incoming connection for protocol ${protocol}`);
    // Handle incoming connections for the custom protocol
    stream.on('data', (data) => {
        handleCustomProtocolMessage(stream.remotePeer, data);
    });
});

// Peer ID of the peer you want to connect to
// const peerId = '...'; // Replace '...' with the actual peer ID

// // Establish a communication channel with the specified peer using the custom protocol
// const { stream } = await node.dialProtocol(peerId, CUSTOM_PROTOCOL_ID);

// Write a message to the stream (sending a message to the specified peer)
// stream.write(Buffer.from('Hello from the sender'));
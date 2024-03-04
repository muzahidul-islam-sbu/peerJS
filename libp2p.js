import process from 'node:process'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
// import { websockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { multiaddr } from 'multiaddr'
import { kadDHT } from '@libp2p/kad-dht'
import { yamux } from '@chainsafe/libp2p-yamux'
import { ping } from '@libp2p/ping' // remove this after done testing
import { bootstrap } from '@libp2p/bootstrap'


import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// import { generateKeyPair, marshalPrivateKey, unmarshalPrivateKey, marshalPublicKey, unmarshalPublicKey } from '@libp2p/crypto/keys'
// import { RSAPeerId, Ed25519PeerId, Secp256k1PeerId, PeerId } from '@libp2p/interface-peer-id'


// TODO: Add Encryption
// const createEd25519PeerId = async () => {
//     const key = await generateKeyPair('Ed25519')
//     const id = await createFromPrivKey(key)
  
//     if (id.type === 'Ed25519') {
//       return id
//     }
  
//     throw new Error(`Generated unexpected PeerId type "${id.type}"`)
//   }

async function main() {
    // Store all the nodes we've created in a map of key=multiaddr and value=peerId 
    const NodeMap = new Map();

    // Can manage creation of nodes here
    // For example, subscribe to events, handle incoming messages, etc.
    // createNode("/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt", NodeMap)

    // For now we'll just create one node
    createNode()

    // Forcefully quit main
    // process.on('SIGTERM', stop);
    // process.on('SIGINT', stop);
}


// Abstract function for creating new nodes
// should be able to take in and register the multiaddr
async function createNode(multiaddr, NodeMap) {
    // Generate a private and public key
    // Each libp2p peer controls a private key, which it keeps secret from all other peers. Every private key has a corresponding public key, which is shared with other peers.
    let customPeerId;
    // try {
    //     customPeerId = await PeerId.create({ 
    //         bits: 2048,
    //         keytype: 'RSA', // or 'RSA' or 'secp256k1', depending on the type of keys
    //         generate: true
    //     // multihash: publicKey,
    //     // privateKey: privateKey
    //     });
    // } catch (error) {
    //     console.log("Error generating PeerId: ", error)
    // }
    const node = await createLibp2p({
        // peerId: customPeerId,
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
            bootstrap({
                list: [
                    // bootstrap node here is generated from dig command
                    '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
                ]
            })
        ],
        services: {
            dht: kadDHT({
                kBucketSize: 20,
            }),
            ping: ping({
                protocolPrefix: 'ipfs',
            }),
        }
    })

    // NodeMap.set(customPeerId, '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt');

        // node.connectionManager.on('peer:connect', (connection) => {
    //     console.info(`Connected to ${connection.remotePeer.toB58String()}!`)
    // })

    // console.log('listening on addresses: ')
    // node.getMultiaddrs().forEach((addr) => {
    //     console.log(addr.toString())
    // })

    // Testing purposes; Retrieve ip address of a bootstrap node:
    // dig -t TXT _dnsaddr.bootstrap.libp2p.io
    const targetAddress = '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
    
    // Replace this with ip address of market server to connect to:
    // Connect to the gRPC server
    const serverMultiaddr = '/ip4/127.0.0.1/tcp/50051'

    try {
        await node.dial(serverMultiaddr)
        // stopNode(node)
    } catch (err) {
        console.error(err)
    }

    startNode(node)

    const PROTO_PATH = __dirname + '/protos/helloworld.proto';

    // Loading package specified in proto file
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
    let helloworld_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

    // Create a gRPC client for the SendFile RPC method
    let client = new helloworld_proto.FileSender('localhost:50051', grpc.credentials.createInsecure());

    client.addFile({ hash: "12974", ip: "127.12.12", port: "80", price: "123" }, function (err, response) {
        console.log(response);
        console.log(err)
    });

    // TODO: Finish being able to retrieve peer id or unique identifier of nodes
    // return customPeerId
}

// Need to pass in the reference to the node, but maybe use a data structure to keep track?
async function startNode(node) {
    // const peerID = node.addresses[0]
    // console.log("Starting node: ", peerID)
    await node.start();
}

async function stopNode(node) {
    // const peerID = node.peerId.toB58String();
    // console.log("Stopping node: ", peerID)
    await node.stop();
}

// Connecting a node to all the peers in its network
// may want to add another parameter "neighbors" to restrict what nodes it can access
async function discoverPeers(node) {
    // Implement peer discovery mechanisms here
    // For example, using bootstrap nodes or mDNS
    try {
        // Use dig to find other examples of bootstrap node addresses
        // we can assume we have these already, hence they're hardcoded
        const bootstrapNodes = [
            '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmZvFnUfyFxkfzfjN7c1j6E1YKgKvZgoCyzp4TD5Yk3BdU'
        ];

        // Connect to each bootstrap node to discover more peers
        for (const addr of bootstrapNodes) {
            const ma = multiaddr(addr);
            await node.dial(ma);
        }

    } catch (error) {
        console.error('Peer discovery failed:', error);
    }
}

async function routeMessage(node, message, targetPeerId) {
    // Route the message to the specified target peer
}

// need to read more into pub sub testing protocols
async function exchangeData(node, peerId, data) {
    // Implement data exchange protocol here
    // Send and receive data with the specified peer
    try {
        // Publish data to a topic
        await node.pubsub.publish(topic, data);
        console.log('Data published:', data);

        // Subscribing means this node will receive notifs
        await node.pubsub.subscribe(topic, (message) => {
            console.log('Received data:', message.data.toString());
        });
        console.log('Subscribed to topic:', topic);

    } catch (error) {
        console.error('Data exchange failed:', error);
    }
}

main()
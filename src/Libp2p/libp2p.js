// Need to decide on ES6 syntax or other
import process from 'node:process'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { multiaddr } from '@multiformats/multiaddr'
import { kadDHT } from '@libp2p/kad-dht'
import { yamux } from '@chainsafe/libp2p-yamux'
import { ping } from '@libp2p/ping' // remove this after done testing
import { bootstrap } from '@libp2p/bootstrap'
import {mdns} from '@libp2p/mdns';

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

import { getPublicKeyFromNode, getPrivateKeyFromNode, printKeyPair, verifyNode } from './public-private-key-pair.js'

// Setting up a websocket to exchange with the gui
import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import geoip from 'geoip-lite';

// const selectedPeerAddr = multiaddr('/ip4/146.190.129.133/tcp/36077/p2p/12D3KooWEfxnYQskJ6wjVts6pNdyFbw4uPcV6LtfEMdWpbEKkxYk')
// try {
//     console.log(`\nConnecting to ${selectedPeerAddr}...`);
//     await test_node2.dial(selectedPeerAddr);
//     console.log(`Connected to ${selectedPeerAddr}`);
// } catch (error) {
//     console.log(error)
//     console.error(`Failed to connect to ${selectedPeerAddr}`);
// }

/**
 * This function returns the peerId of a node
 * @param {Libp2p} node - the libp2p node
 * @returns {Ed25519PeerId} the peerId associated with the libp2p node
 */
export function getPeerID(node) {
    // console.log(node.peerId);
    return node.peerId;
}

// console.log("PeerID of test node:", getPeerID(test_node));
// console.log("Information of known peers on the network:", await test_node.peerStore.get(getPeerID(test_node)));

// console.log("Peer Routing Information:", await test_node.peerRouting.findPeer(getPeerID(test_node)));
// should pass in peerId of another node

/**
 * This function returns the multiaddress of a given node
 * @param {Libp2p} node 
 * @returns {Multiaddr} the multiaddress associated with a node
 */
function getMultiaddrs(node) {
    const multiaddrs = node.getMultiaddrs();
    const multiaddrStrings = multiaddrs.map(multiaddr => multiaddr.toString());
    return multiaddrStrings;
}

// console.log("Multiaddr of test node:", getMultiaddrs(test_node));
// console.log("Peers that are connected:", test_node.getPeers());

async function main() {
    // For now we'll just create one node
    // test_node = createNode()

    // Store all the nodes we've created in a map of key=multiaddr and value=peerId 
    const NodeMap = new Map();

    getPeerID(test_node);
    getPublicKeyFromNode(test_node);
    getPrivateKeyFromNode(test_node);

    const publicKey = getPublicKeyFromNode(test_node)

    console.log("public key belongs to this node: ", await verifyNode(test_node, publicKey));

    // When node information is requested, send it to the GUI
    const nodeInfo = getPeerID(test_node);
    // const nodePublicKey = getPublicKeyFromNode(test_node);

    // printKeyPair();

    // Can manage creation of nodes here
    // For example, subscribe to events, handle incoming messages, etc.
    // createNode("/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt", NodeMap)

    // Forcefully quit main
    // process.on('SIGTERM', stop);
    // process.on('SIGINT', stop);
} 

// TODO: Add Encryption
// const createEd25519PeerId = async () => {
//     const key = await generateKeyPair('Ed25519')
//     const id = await createFromPrivKey(key)
  
//     if (id.type === 'Ed25519') {
//       return id
//     }
  
//     throw new Error(`Generated unexpected PeerId type "${id.type}"`)
//   }

// Abstract function for creating new nodes
// should be able to take in and register the multiaddr
async function createNode() {
    const ws = new WebSocket('ws://localhost:5173')
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
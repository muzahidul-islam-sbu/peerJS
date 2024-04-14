import displayMenu from "./Libp2p/cli.js"
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { kadDHT } from '@libp2p/kad-dht'
import { yamux } from '@chainsafe/libp2p-yamux'
import { ping } from '@libp2p/ping' // remove this after done testing
import { bootstrap } from '@libp2p/bootstrap'
import { mdns } from '@libp2p/mdns';
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createPeerInfo, getKeyByValue } from './Libp2p/peer-node-info.js'
import { generateRandomWord, getPublicMultiaddr, bufferedFiles, recievedPayment } from './Libp2p/utils.js'
import geoip from 'geoip-lite';
import { handleRequestFile, handleDownloadFile, payForChunk, handlePayForChunk } from "./Libp2p/protocol.js"
import {EventEmitter} from 'node:events';
import { createHTTPGUI } from "./Libp2p/gui-connection.js"

class Emitter extends EventEmitter {}

const options = {
    emitSelf: false, // Example: Emit to self on publish
    gossipIncoming: true, // Example: Automatically gossip incoming messages
    fallbackToFloodsub: true, // Example: Fallback to floodsub if gossipsub is not supported
    floodPublish: true, // Example: Send self-published messages to all peers
    doPX: false, // Example: Enable PX
    // msgIdFn: (message) => message.from + message.seqno.toString('hex'), // Example: Custom message ID function
    signMessages: true // Example: Sign outgoing messages
}

// export { test_node2, test_node }
async function main() {
    // displayMenu(null, test_node)

    // libp2p node logic
    const test_node = await createLibp2p({
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
            mdns(),
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
    });

    const test_node2 = await createLibp2p({
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
            mdns(),
            bootstrap({
                list: [
                    // bootstrap node here is generated from dig command
                    '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
                ]
            })
        ],
        services: {
            pubsub: gossipsub(options)
        }
    });

    await test_node2.start();
    console.log('Test Node 2 has started:', test_node2.peerId);
    console.log("Actively searching for peers on the local network...");
    // console.log("Multiaddr of Test Node 2:", getMultiaddrs(test_node2));

    // Gossip Sub implementation 
    test_node2.services.pubsub.addEventListener('message', (message) => {
        console.log(`${message.detail.topic}:`, new TextDecoder().decode(message.detail.data))
    })
      
    test_node2.services.pubsub.subscribe('fruit')

    const discoveredPeers = new Map()
    const ipAddresses = [];
    let local_peer_node_info = {};

    test_node2.addEventListener('peer:discovery', (evt) => {
        try {
            const peerId = evt.detail.id;
            console.log(`Peer ${peerId} has disconnected`)
            const multiaddrs = evt.detail.multiaddrs;

            ipAddresses.length = 0;

            multiaddrs.forEach(ma => {
                const multiaddrString = ma.toString();
                const ipRegex = /\/ip4\/([^\s/]+)/;
                const match = multiaddrString.match(ipRegex);
                const ipAddress = match && match[1];

                if(ipAddress) {
                    ipAddresses.push(ipAddress);
                }
            });

            let peerInfo = new Object();

            ipAddresses.forEach(ip => {
                const location = geoip.lookup(ip);
                peerInfo = createPeerInfo(location, peerId, multiaddrs[1], peerId.publicKey);
            });

            // console.log(evt.detail);
            // Get non 127... multiaddr and convert the object into a string for parsing
            const nonlocalMultaddr = evt.detail.multiaddrs.filter(addr => !addr.toString().startsWith('/ip4/127.0.0.')).toString();
            // console.log(nonlocalMultaddr);
            // Extract IP address
            const ipAddress = nonlocalMultaddr.split('/')[2];
            // Extract port number
            const portNumber = nonlocalMultaddr.split('/')[4];
            // console.log('IP address:', ipAddress);
            // console.log('Port number:', portNumber);

            local_peer_node_info = {ip_address: ipAddress, port : portNumber}

            const randomWord = generateRandomWord();
            discoveredPeers.set(randomWord, peerInfo);
            // console.log("Discovered Peers: ", discoveredPeers);
            console.log('\nDiscovered Peer with PeerId: ', peerId);
            // console.log("IP addresses for this event:", ipAddresses);
        } catch (error) {
            console.error("Error occured when connecting to node", error)
        }
    });


    test_node2.addEventListener('peer:disconnect', (evt) => {
        try {
            const peerId = evt.detail;
            console.log(`Peer ${peerId} has disconnected`)
            console.log(`\nPeer with ${peerId} disconnected`)
            const keyToRemove = getKeyByValue(discoveredPeers, peerId);
            if (keyToRemove !== null) {
                discoveredPeers.delete(keyToRemove);
            } else {
                console.log("PeerId not found in the map.");
            }
        } catch (error) {
            console.log("Error occured when disconnecting", error)
        }
    });

    const publicMulti = await getPublicMultiaddr(test_node2)
    console.log(publicMulti);
    test_node2.getMultiaddrs().forEach((addr) => {
        console.log(addr.toString())
    })
    

    // Set up protocols
    const emitter = new Emitter();
    emitter.on('receivedChunk', async (price, producerMA) => {
        try {
            const stream = await test_node2.dialProtocol(producerMA, '/fileExchange/1.0.2');
            await payForChunk(stream, price);
        } catch (err) {console.log(err)}
    }) 
    test_node2.handle('/fileExchange/1.0.0', handleRequestFile);
    test_node2.handle('/fileExchange/1.0.1', ({ connection, stream }) => handleDownloadFile(stream, connection, bufferedFiles, emitter))
    test_node2.handle('/fileExchange/1.0.2',({ connection, stream }) => handlePayForChunk(connection, stream, recievedPayment))
    
    const stop = async (node) => {
        // stop libp2p
        await node.stop()
        console.log('\nNode has stopped: ', node.peerId)
        process.exit(0)
    }
    process.on('SIGTERM', () => stop(test_node2))
    process.on('SIGINT', () => stop(test_node2))
    createHTTPGUI(test_node2);

    displayMenu(discoveredPeers, test_node2);
}

main()
import displayMenu from "./cli.js"
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { kadDHT } from '@libp2p/kad-dht'
import { yamux } from '@chainsafe/libp2p-yamux'
import { ping } from '@libp2p/ping' // remove this after done testing
import { bootstrap } from '@libp2p/bootstrap'
import {mdns} from '@libp2p/mdns';
import { createPeerInfo } from './peer-node-info.js'
import { generateRandomWord } from './utils.js'
import geoip from 'geoip-lite';

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
            mdns()
        ]
    });

    await test_node2.start();
    console.log('Test Node 2 has started:', test_node2.peerId);
    console.log("Actively searching for peers on the local network...");
    // console.log("Multiaddr of Test Node 2:", getMultiaddrs(test_node2));

    const discoveredPeers = new Map()
    const ipAddresses = [];
    let local_peer_node_info = {};

    test_node2.addEventListener('peer:discovery', (evt) => {
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
    });


    test_node2.addEventListener('peer:disconnect', (evt) => {
        const peerId = evt.detail;
        console.log(`Peer ${peerId} has disconnected`)
        console.log(`\nPeer with ${peerId} disconnected`)
        const keyToRemove = getKeyByValue(discoveredPeers, peerId);
        if (keyToRemove !== null) {
            discoveredPeers.delete(keyToRemove);
        } else {
            console.log("PeerId not found in the map.");
        }
    });

    displayMenu(discoveredPeers, test_node2);
}

main()
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { kadDHT } from '@libp2p/kad-dht'
import { multiaddr } from 'multiaddr'
import { tcp } from '@libp2p/tcp'
import { send, handler } from './fileExchange.js'

// Known peers addresses
const bootstrapMultiaddrs = [
    '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
]

async function createNode () {
    return createLibp2p({
        transports: [tcp()],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
        services: {
            dht: kadDHT({
                kBucketSize: 20,
            }),
        },
        peerDiscovery: [
            bootstrap({
                list: [bootstrapMultiaddrs]
            })
        ],   
        addresses: {
            // add a listen address (localhost) to accept TCP connections on a random port
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
    })
}

async function run() {
    const node = await createNode();
    node.addEventListener('peer:discovery', (evt) => {
        console.log('Discovered %s', evt.detail.id.toString()) // Log discovered peer
    })

    node.addEventListener('peer:connect', (evt) => {
        console.log('Connected to %s', evt.detail.toString()) // Log connected peer
    })

    node.addEventListener('peer:disconnect', (evt) => {
        const remotePeer = evt.detail
        console.log('disconnected to: ', remotePeer.toString())
    })

    console.log('Node has started: ', node.peerId)

    console.log('libp2p is listening on the following addresses: ')
    node.getMultiaddrs().forEach((addr) => {
        console.log(addr.toString())
    })

    process.stdin.on('data', async (input) => {
        const inputString = input.toString().trim();
        const [addr, filepath] = inputString.split(' '); // Split input by space
        console.log('Sending file');
        
        // Dial to the consumer peer 
        const consumerMA = multiaddr(addr)
        const stream = await node.dialProtocol(consumerMA, '/fileExchange/1.0.0')
        
        console.log('Producer dialed to consumer on protocol: /fileExchange/1.0.0')
        send(stream, filepath, node, consumerMA);
    })

    node.handle('/fileExchange/1.0.0', ({ stream }) => {
        console.log('Downloading File')
        handler(stream);
    })


    const stop = async () => {
        // stop libp2p
        await node.stop()
        console.log('Node has stopped: ', node.peerId)
        process.exit(0)
    }

    process.on('SIGTERM', stop)
    process.on('SIGINT', stop)
}

run();
// const targetAddr = multiaddr('/ip4/192.168.56.1/tcp/64982/p2p/12D3KooWSKQuMtG6Nck5CjpjcoK1kSXEjQ3yinkMMjDUSoAdGacT')
// try {
    //     await node.dial(targetAddr)
    // } catch (err) {
//     console.log(err)
// }
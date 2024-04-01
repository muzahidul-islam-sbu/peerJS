import { createLibp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { kadDHT } from '@libp2p/kad-dht'
import { multiaddr } from 'multiaddr'
import { tcp } from '@libp2p/tcp'
import { send, handler } from './fileExchange.js'
import peerIdJson from './peer-id.js'
import PeerId from 'peer-id';
import { createFromJSON } from '@libp2p/peer-id-factory'
import { pipe } from 'it-pipe'
import map from 'it-map'
import * as lp from 'it-length-prefixed'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import https from 'https';
import { Producer as producer } from '../Producer/producer.js';
import { Consumer as consumer } from '../Consumer/consumer.js';

import crypto from 'crypto';
import { readFileSync, readdir } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 50936;
let publicIP;
const fetchPublicIP = () => {
    return new Promise((resolve, reject) => {
        https.get('https://api.ipify.org?format=json', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            publicIP = JSON.parse(data).ip;
            resolve(publicIP);
        });
        }).on('error', (error) => {
        reject(error);
        });
    });
};


// Known peers addresses
const bootstrapMultiaddrs = [
    '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
]

async function createNode (id) {
    return createLibp2p({
        peerId: id,
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
                list: bootstrapMultiaddrs
            })
        ],   
        addresses: {
            // add a listen address (localhost) to accept TCP connections on a random port
            listen: ['/ip4/0.0.0.0/tcp/50936']
        },
    })
}

async function run() {
    await fetchPublicIP();
    const id = await createFromJSON(peerIdJson);
    const node = await createNode(id);
    await node.start();
    // node.addEventListener('peer:discovery', (evt) => {
    //     console.log('Discovered %s', evt.detail.id.toString()) // Log discovered peer
    // })

    // node.addEventListener('peer:connect', (evt) => {
    //     console.log('Connected to %s', evt.detail.toString()) // Log connected peer
    // })

    // node.addEventListener('peer:disconnect', (evt) => {
    //     const remotePeer = evt.detail
    //     console.log('disconnected to: ', remotePeer.toString())
    // })

    console.log('Node has started: ', node.peerId)

    console.log('libp2p is listening on the following address: ')
    // node.getMultiaddrs().forEach((addr) => {
    //     console.log(addr.toString())
    // })
    let addr = node.getMultiaddrs()[0].toString();
    let parts = addr.split('/');
    parts[2] = publicIP;
    const publicMultiaddr = parts.join('/');
    console.log(publicMultiaddr);

    process.stdin.on('data', async (input) => {
        const inputString = input.toString().trim();
        const type = inputString.split(' ')[0];

        if (type == 'request') {
            const [_, prodIp, prodPort, prodId, fileHash] = inputString.split(' '); // Split input by space
            const curAddr = publicMultiaddr;
            
            // Dial to the producer peer 
            const addr = '/ip4/' + prodIp + '/tcp/' + prodPort + '/p2p/' + prodId; 
            const producerMA = multiaddr(addr)
            try {
                const stream = await node.dialProtocol(producerMA, '/fileExchange/1.0.0');
                await pipe(
                    [curAddr + ' ' + fileHash], 
                    // Turn strings into buffers
                    (source) => map(source, (string) => uint8ArrayFromString(string)),
                    // Encode with length prefix (so receiving side knows how much data is coming)
                    (source) => lp.encode(source),
                    stream.sink
                    );
                    await stream.close();
                console.log('Requested file');
            } catch (err) {console.log(err)}
        } else if (type == 'send') {
            let [_, addr, fileHash] = inputString.split(' '); // Split input by space
            let actualPath = ''
            readdir('testProducerFiles/', (err, files) => {
                for (const file of files) {
                    const filePath = join(__dirname, 'testProducerFiles/', file);
                    const fileContent = readFileSync(filePath);
                    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
                    
                    if (fileHash == hash) {
                        actualPath = filePath;
                    }
                }
            })
            // Dial to the consumer peer 
            const consumerMA = multiaddr(addr)
            try {
                const stream = await node.dialProtocol(consumerMA, '/fileExchange/1.0.1');
                console.log('Producer dialed to consumer on protocol: /fileExchange/1.0.1')
                send(stream, actualPath, node, consumerMA);
            } catch (err) {console.log(err)}
        } else if (type == 'register') {
            let [_, name, price, hash] = inputString.split(' '); // Split input by space
            price = parseInt(price);
            producer.registerFile(hash, node.peerId.toString(), name, publicIP, port, price);
        } else if (type == 'viewProducers') {
            let [_, hash] = inputString.split(' '); // Split input by space
            consumer.viewProducers(hash);
        } else if (type == 'hash') {
            let [_, fileName] = inputString.split(' '); // Split input by space
            const filePath = join(__dirname, 'testProducerFiles/', fileName);
            const fileContent = readFileSync(filePath);
            const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            console.log('Filehash: ', fileHash);
        }
    })

    node.handle('/fileExchange/1.0.0', async ({ stream }) => {
        await pipe(
            stream.source,
            // Decode length-prefixed data
            (source) => lp.decode(source),
            // Turn buffers into strings
            (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
            async function (source) {
                for await (var message of source) {
                    console.log('Requesting: ' + message)
                    // const consumerMA = multiaddr(consumerAddr);
                    // const stream = await node.dialProtocol(consumerMA, '/fileExchange/1.0.1');
                    // send(stream, filepath, node, consumerMA);
                }
            }
        )
        await stream.close();
        // handler(stream);
    })

    node.handle('/fileExchange/1.0.1', ({ stream }) => {
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

const createId = async () => {
    const id = await PeerId.create({ bits: 1024, keyType: 'RSA' })
    console.log((id.toJSON()))
}

run();

// run once
// createId();

import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import {mdns} from '@libp2p/mdns';

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

node.handle('/protocol/1.0.0', ({ stream }) => {
    console.log('Receiving Message')
    handleMesage(stream);
})

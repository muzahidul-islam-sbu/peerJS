import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { multiaddr } from '@multiformats/multiaddr'


const ma = '/ip4/192.168.1.160/tcp/55259/p2p/12D3KooWSuVFVZ5go9jDdpUWxUNbqsGwPsmjTD7DwHnYPvs4uP7c'
await hwnode.dial(ma)

async function connect() {
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
    })
}

// Connect to your friend's node
connect().catch((error) => {
    console.error('Error in connecting:', error);
});

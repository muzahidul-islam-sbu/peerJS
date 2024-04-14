import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import { mdns } from '@libp2p/mdns';
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

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
    console.log('Test Node has started:', node.peerId);
    console.log("Actively searching for peers on the local network...");
    // console.log("Multiaddr of Test Node 2:", getMultiaddrs(node2));


    // Gossip Sub implementation 
    node.services.pubsub.addEventListener('message', (message) => {
        console.log(`${message.detail.topic}:`, new TextDecoder().decode(message.detail.data))
    })
    
    node.addEventListener('peer:connect', (evt) => {
        const peerId = evt.detail;
        console.log('\nConnected Peer with PeerId: ', peerId);
        node.services.pubsub.subscribe('fruit');
        console.log("Node subscribed to topic fruit");
        node.services.pubsub.publish('fruit', new TextEncoder().encode('banana'));
    });

    // node.services.pubsub.publish('fruit', new TextEncoder().encode('banana'));
}

main()
import { test_node2, test_node } from "./libp2p/libp2p.js";
import { multiaddr } from '@multiformats/multiaddr'

function getKeyByValue(map, value) {
    const peerIdToRemove = value.toString();
    for (let [key, val] of map.entries()) {
        let peerId = val.peerId;
        let peerIdString = peerId.toString();
        if (peerIdString === peerIdToRemove) {
            return key;
        }
    }
    return null; 
}

export const listConnectedPeers = (node) => {
    console.log(node.getPeers());
}

function findPeerInfoByPeerId(peerMap, peerId) {
    for (const [randomWord, info] of peerMap.entries()) {
        console.log(info.peerId)
        console.log(peerId)
        if (info.peerId === peerId) {
            console.log("ceck this: ")
            console.log(info)
            console.log(randomWord)
            return info;
        }
    }
    return null;
}

// Connecting a node to all the bootstrap peers in its network
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
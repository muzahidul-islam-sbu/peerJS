import { test_node2 } from "./libp2p";

const ipAddresses = [];
let local_peer_node_info = {};

test_node2.addEventListener('peer:discovery', (evt) => {
    const peerId = evt.detail.id;
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
    console.log(`\nPeer with ${peerId} disconnected`)
    const keyToRemove = getKeyByValue(discoveredPeers, peerId);
    if (keyToRemove !== null) {
        discoveredPeers.delete(keyToRemove);
    } else {
        console.log("PeerId not found in the map.");
    }
});

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

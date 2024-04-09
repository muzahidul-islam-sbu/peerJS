export const getPeerID = (node) => {
    // console.log(node.peerId);
    return node.peerId;
}

export const getKeyByValue = (map, value) => {
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

export const createPeerInfo = (location, peerId, multiaddr, publicKey) => {
    const locationInfo = location !== null ? {
        city: location.city,
        state: location.region,
        country: location.country,
        latitude: location.ll[0],
        longitude: location.ll[1]
    } : null;

    const peerInfo = {
        peerId: peerId,
        multiaddr: multiaddr,
        publicKey: publicKey,
        location: locationInfo
    };

    return peerInfo;

}

export const generateRandomWord = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let word = '';
    for (let i = 0; i < 5; i++) {
        word += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return word;
}

export const getMultiaddrs = (node) => {
    const multiaddrs = node.getMultiaddrs();
    return multiaddrs;
}

export const parseMultiaddr = (multiaddr) => {
    const components = multiaddr.split('/');
    const result = {
        networkProtocol: '',
        transportLayerProtocol: '',
        portNumber: '',
        p2pPeerID: ''
    };
  
    // Iterate through the components to fill in the result object
    components.forEach((component, index) => {
        switch (component) {
        case 'ip4':
        case 'ip6':
            result.networkProtocol = component;
            break;
        case 'tcp':
        case 'udp':
            result.transportLayerProtocol = component;
            if (components[index + 1]) {
            result.portNumber = components[index + 1];
            }
            break;
        case 'p2p':
            if (components[index + 1]) {
            result.p2pPeerID = components[index + 1];
            }
            break;
        }
    });
  
    return result;
}
import https from 'https';

export function generateRandomWord() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let word = '';
    for (let i = 0; i < 5; i++) {
        word += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return word;
}

/**
 * This function generates a peerId using a generate public/private key pair
 * @returns {void}
 */
export async function generatePeerId() {
    try {
      // Assuming publicKey and privateKey are available from previous operations
      const {_key: privateKey, _publicKey: publicKey} = await generateKeyPair('ed25519');
  
      const peerId = await peerIdFromKeys(publicKey, privateKey);
      console.log('Generated PeerId:', peerId);
    } catch (error) {
      console.error('Error generating PeerId:', error);
    }
  }
// generatePeerId();


/**
 * This function generates a result object with specific values.
 * @param {Multiaddr} multiaddr - the multiaddr of a node
 * @returns {Object} An object with the following properties:
 * - networkProtocol: The network protocol (string).
 * - transportLayerProtocol: The transport layer protocol (string).
 * - portNumber: The port number (string).
 * - p2pPeerID: The P2P peer ID (string).
 */
export function parseMultiaddr(multiaddr) {
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
// Example usage
// const multiaddrString = '/ip4/127.0.0.1/tcp/53959/p2p/12D3KooWStnQUitCcYegaMNTNyrmPaHzLfxRE79khfPsFmUYuRmC';
// const parsed = parseMultiaddr(multiaddrString);
// console.log("Example of parsing a multiaddr:", parsed);

export async function fetchPublicIP() {
    let publicIP;
    await new Promise((resolve, reject) => {
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
    return publicIP;
};

export async function getPublicMultiaddr(node) {
    const publicIP = await fetchPublicIP();
    let addr = node.getMultiaddrs()[0].toString();
    let parts = addr.split('/');
    parts[2] = publicIP;
    const publicMultiaddr = parts.join('/');
    return publicMultiaddr;
}

let recievedPayment = {};
let bufferedFiles = {};
let fileRequests = [];
export {recievedPayment, bufferedFiles, fileRequests}
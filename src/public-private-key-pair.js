import { generateKeyPair} from '@libp2p/crypto/keys'
import { peerIdFromKeys, peerIdFromString } from '@libp2p/peer-id'
import { getPeerID } from './libp2p.js';

import tweetnacl from 'tweetnacl';
const { box, randomBytes } = tweetnacl;
import tweetnaclUtil from 'tweetnacl-util';
const { encodeBase64, decodeBase64 } = tweetnaclUtil;
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import {mdns} from '@libp2p/mdns';
import { Ed25519PublicKey, Ed25519PrivateKey } from '@libp2p/crypto/keys';

const aliceKeyPair = box.keyPair();
const bobKeyPair = box.keyPair();
const camKeyPair = box.keyPair();

console.log("Alice Key Pair:", aliceKeyPair);
console.log("Bob Key Pair:", bobKeyPair);

// Simulate sharing of public keys
const alicePublicKey = aliceKeyPair.publicKey;
const bobPublicKey = bobKeyPair.publicKey;

// Message to be sent
const encoder = new TextEncoder();
const test_message = 'Hello, Bob!';
const messageUint8Array = encoder.encode(test_message);

// Encrypt message using Bob's public key
const nonce = randomBytes(box.nonceLength);
const encryptedMessage = box(
  messageUint8Array,
  nonce,
  bobPublicKey,
  aliceKeyPair.secretKey
);

console.log("Encrypted message: ", encryptedMessage);

// Encode encrypted message and nonce to be sent over libp2p
const encodedMessage = encodeBase64(encryptedMessage);
const encodedNonce = encodeBase64(nonce);


// Send encodedMessage and encodedNonce over libp2p stream

// On the receiving side:
// Decode received message and nonce
const decodedMessage = decodeBase64(encodedMessage);
const decodedNonce = decodeBase64(encodedNonce);

// Decrypt message using own secret key and sender's public key
const decoder = new TextDecoder('utf-8');
const decryptedMessage = decoder.decode(box.open(decodedMessage, decodedNonce, alicePublicKey, bobKeyPair.secretKey));

console.log('Decrypted message:', decryptedMessage);

/**
 * This function returns the public key of a node
 * @param {Libp2p} node 
 * @returns {Uint8Array} - the public key represented as an array of 8-bit unsigned integers
 */
export function getPublicKeyFromNode(node) {
    const peerId = getPeerID(node);
    try {
      if(peerId.publicKey) {
        const publicKey = peerId.publicKey;
        // console.log("Public Key:", publicKey.toString('base64'));
        return publicKey;
      } else {
        console.log("Public key is not embedded in this Peer ID.");
      }

    } catch(error) {
      console.error("Error retrieving public key:", error);
    }
}
// console.log("Public Key from test node:", getPublicKeyFromNode(test_node));

/**
 * This function returns the public key of a node
 * @param {Libp2p} node 
 * @returns {Uint8Array} the private key represented as an array of 8-bit unsigned integers
 */

export function getPrivateKeyFromNode(node) {
    const peerId = getPeerID(node);
    try {
        if(peerId.privateKey) {
            const privateKey = peerId.privateKey;
            // console.log("Private Key:", privateKey.toString('base64'));
            return privateKey;
        } else {
            console.log("Private key is not embedded in this Peer ID.");
        }
    } catch(error) {
        console.error("Error retrieving private key:", error);
    }
}

/**
 * This function creates a public/private key pair and prints the keys as well as their representation in string and hex format
 * @returns {void}
 */
export async function printKeyPair() {
    try {
        const keyPair = await generateKeyPair('ed25519');
        const {_key: privateKey, _publicKey: publicKey} = keyPair
        const privateKeyString = privateKey.toString('base64'); 
        const publicKeyString = publicKey.toString('base64');   
        const publicKeyHex = publicKey.toString('hex');
        const privateKeyHex = privateKey.toString('hex');


        console.log('Public Key:', publicKey);
        console.log('Private Key:', privateKey);
        console.log("Public Key String Format:", publicKeyString);
        console.log("Private Key String Format:", privateKeyString);
        console.log("Public Key Hex Format:", privateKeyHex);
        console.log("Private Key Hex Format:", privateKeyHex);

    } catch (error) {
        console.error('Error generating key pair:', error);
    }
}

/**
 * This function verifies whether the public key belongs to a node
 * @param {Libp2p} node 
 * @param {Uint8Array} publicKey - the public key associated with the libp2p node
 * @returns {boolean} True if the key belongs to the node, otherwise false
 */

export async function verifyNode(peerId, publicKey) {
    const peerIdKey = await peerIdFromKeys(publicKey)

    console.log("Peer ID: ", peerId);
    console.log("Peer ID from Key:", peerIdKey);
    
    const peerIdString = peerId.toString();
    const peerIdKeyString = peerIdKey.toString();

    console.log("Peer ID String from node:", peerIdString);
    console.log("Peer ID String from Key:", peerIdKeyString);
    // Compare the string representations
    if (peerIdString === peerIdKeyString) {
        return true
    } else {
        return false
    }
}

const node1 = await createLibp2p({
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

const node2 = await createLibp2p({
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

// console.log("Node 1 peerId type:", node1.peerId.type);
// console.log("Node 1 public key", node1.peerId.publicKey)
// console.log("Node 1 private key:", node1.peerId.privateKey)

const message = Buffer.from('This is a secret message');

console.log(`Actual Public Key Length: ${node1.peerId.publicKey.slice(4).length} bytes`); // Should be 32 bytes
console.log(`Actual Private Key Length: ${node1.peerId.privateKey.slice(4).length} bytes`); // Should be 64 bytes

console.log("Public Key:", node1.peerId.publicKey.slice(4));
console.log("Private Key:", node1.peerId.privateKey.slice(4));

const publicKey = new Ed25519PublicKey(node1.peerId.publicKey.slice(4));
console.log("Actual Public Key:", publicKey);
const privateKey = new Ed25519PrivateKey(node1.peerId.privateKey.slice(4), node1.peerId.publicKey.slice(4))
console.log("Actual Private Key:", privateKey);

const signature = privateKey.sign(message);
const isValid = publicKey.verify(message, signature);

console.log("Is Valid? :", isValid);
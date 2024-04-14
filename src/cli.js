import readline from 'readline';
import connectToGUI from './gui-connection.js';
import { recievedPayment, bufferedFiles, getPublicMultiaddr } from './utils.js';
import * as lp from 'it-length-prefixed'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { multiaddr } from 'multiaddr'
import { payForChunk, sendRequestFile, uploadFile } from './protocol.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'node:fs';
import { Producer } from './Producer_Consumer/producer.js';
import { Consumer } from './Producer_Consumer/consumer.js';
import crypto from 'crypto';

/**
 * TODO:
 * -transfer files
 * -conduct a wallet transfer
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
export default function displayMenu(discoveredPeers, node) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    function displayOptions() {
        console.log("\nMenu Options:");
        console.log("1. List discovered peers");
        // console.log("2. List known information on a peer");
        console.log("2. List connected peers");
        console.log("3. Retrieve a peers public key");
        console.log("4. Connect to GUI");
        console.log("5. Make a market transaction???");
        console.log("6. Connect to a public peer");
        console.log("7. Send Message");
        console.log("8. Request file");
        console.log("9. Send file");
        console.log("10. Pay for chunk");
        console.log("11. Register file to market");
        console.log("12. Get producers of file");
        console.log("13. Hash a file");
        console.log("_. Exit");

        rl.question("\nEnter your choice: ", async (choice) => {
            switch (choice) {
                case '1':
                    console.log("Peers that are discovered:", discoveredPeers);
                    displayOptions();
                    break;
                // case '2':
                //     console.log("Peers available:");
                //     discoveredPeers.forEach((peerInfo, randomWord) => {
                //         console.log(`${randomWord}, ${peerInfo.peerId}`);
                //     });
                //     rl.question("\nEnter the 5-letter word of the peer you want to find information on: ", async (word) => {
                //         const selectedPeerInfo = discoveredPeers.get(word);
                //         const selectedPeerId = selectedPeerInfo.peerId;
                //         if (selectedPeerId) {
                //             try {
                //                 const peer = await node.peerStore.get(selectedPeerId)
                //                 console.log("Known information about this peer: ", peer)
                //             } catch (error) {
                //                 console.error(`Failed to connect to ${selectedPeerId}`);
                //             }
                //         } else {
                //             console.log("Invalid peer. Please try again");
                //         }
                //         displayOptions();
                //     });
                //     break;
                case '2':
                    console.log("Peers you are currently connected to:");
                    console.log(node.getPeers());
                    displayOptions();
                    break;
                case '3':
                    console.log("Peers available:");
                    discoveredPeers.forEach((peerInfo, randomWord) => {
                        console.log(`${randomWord}, ${peerInfo.peerId}`);
                    });
                    rl.question("\nEnter the 5-letter word of the peer you want: ", async (word) => {
                        const selectedPeerInfo = discoveredPeers.get(word);
                        const selectedPeerId = selectedPeerInfo.peerId;
                        if (selectedPeerId) {
                            try {
                                const publicKey = await node.getPublicKey(selectedPeerId);
                                console.log("Public Key of Peer: ", publicKey);
                            } catch (error) {
                                console.error(`Failed to retrieve information of public key on  ${selectedPeerId}`);
                            }
                        } else {
                            console.log("Invalid peer. Please try again");
                        }
                        displayOptions();
                    });
                    break;
                case '4':
                    connectToGUI();
                    displayOptions();
                    break;
                case '5':
                    console.log("Make a market transaction");
                    break;
                case '6':
                    console.log("Connect to a public peer node:");
                    rl.question("\nEnter IP Address of public node you're connecting to: ", async (ipAddress) => {
                        rl.question("\nEnter Port number the node you're connecting to is listening on: ", async (portNumber) => {
                            rl.question("\nEnter the Peer ID: ", async (peerID) => {
                                let userInputMultiAddr = multiaddr(`/ip4/${ipAddress}/tcp/${portNumber}/p2p/${peerID}`);
                                console.log("Your multiaddress string is: ", userInputMultiAddr);
                                try {
                                    console.log(`\nConnecting to ${userInputMultiAddr}...`);
                                    await node.dial(userInputMultiAddr);
                                    console.log(`Connected to ${userInputMultiAddr}`);
                                    let peerInfo = new Object();
                                    const location = geoip.lookup(ipAddress);
                                    peerInfo = createPeerInfo(location, peerID);
                                    const randomWord = generateRandomWord();
                                    discoveredPeers.set(randomWord, peerInfo);
                                } catch (error) {
                                    console.error(`Failed to connect to ${userInputMultiAddr}`);
                                    console.log(error)
                                    console.error(`Please confirm you answered all of the questions correctly and that firewall rules have been adjusted for port ${portNumber}`);
                                }
                                displayOptions();
                            });
                        });
                    });
                    break;
                case '7':
                    console.log("Peers available:");
                    discoveredPeers.forEach((peerInfo, randomWord) => {
                        console.log(`${randomWord}, ${peerInfo.peerId}`);
                    });
                    rl.question("\nEnter the 5-letter word of the peer you want: ", async (word) => {
                        const selectedPeerInfo = discoveredPeers.get(word);
                        const selectedPeerId = selectedPeerInfo.peerId;
                        const selectedPeerMA = selectedPeerInfo.multiaddr;
                        if (selectedPeerId) {
                            try {
                                rl.question("\nEnter Message to be sent: ", async(message) => {
                                    const stream = await node.dialProtocol(selectedPeerMA, '/protocol/1.0.0');
                                    console.log('test_node2 dials to receiver: on protocol /protocol/1.0.0')
                                    sendMessage(stream, node, selectedPeerId, message, selectedPeerMA);
                                });
                            } catch (error) {
                                console.error(`Failed to set up communication channel  ${selectedPeerId}`);
                            }
                        } else {
                            console.log("Invalid peer. Please try again");
                        }
                        displayOptions();
                    });
                    break;
                case '8':
                    rl.question("Format: request [prodIp] [prodPort] [prodId] [fileHash]\n", async (command) => {
                        const [_, prodIp, prodPort, prodId, fileHash] = command.split(' '); // Split input by space
                        const curAddr = await getPublicMultiaddr(node);

                        // Dial to the producer peer 
                        const addr = '/ip4/' + prodIp + '/tcp/' + prodPort + '/p2p/' + prodId; 
                        const producerMA = multiaddr(addr)
                        try {
                            const stream = await node.dialProtocol(producerMA, '/fileExchange/1.0.0');
                            await sendRequestFile(stream, curAddr, fileHash)
                        } catch (err) {console.log(err)}
                        displayOptions();
                    })
                    break;
                case '9':
                    rl.question("Format: send [consumer_multiaddr] [fileHash] [price]\n", async (command) => {
                        try {
                        let [_, addr, fileHash, price] = command.split(' '); // Split input by space
                        let actualPath = join(__dirname, 'testProducerFiles/', fileHash);
                        price = parseInt(price);
                        // readdir('testProducerFiles/', (err, files) => {
                        //     for (const file of files) {
                        //         const filePath = join(__dirname, 'testProducerFiles/', file);
                        //         const fileContent = readFileSync(filePath);
                        //         const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
                                
                        //         if (fileHash == hash) {
                        //             actualPath = filePath;
                        //         }
                        //     }
                        // })
                        // Dial to the consumer peer 
                        const consumerMA = multiaddr(addr)
                        const timer = ms => new Promise( res => setTimeout(res, ms));
                        const consID = addr.split('/')[addr.split('/').length-1]
                        fs.readFile(actualPath, async (err, data) => {
                            if (!recievedPayment.hasOwnProperty(consID)) {
                                recievedPayment[consID] = true;
                            }
                            
                            let numChunks = 0;
                            const MAX_CHUNK_SIZE = 63000;
                            
                            if (err) {
                                console.error('Error reading file:', err);
                                return;
                            }
                            numChunks = Math.ceil(data.length / MAX_CHUNK_SIZE);
                            
                            for (let i = 0; i < numChunks; i += 1) {
                                while (!recievedPayment[consID]) {
                                    console.log('Waiting')
                                    await timer(3000);
                                }
                            
                                const stream = await node.dialProtocol(consumerMA, '/fileExchange/1.0.1');
                                console.log('Producer dialed to consumer on protocol: /fileExchange/1.0.1')
                                uploadFile(i, i == numChunks-1, price, stream, actualPath, node, consumerMA);
                                recievedPayment[consID] = false;
                            }
                            displayOptions();
                        });
                        } catch (err) {console.log(err)}
                    })
                    break;
                case '10':
                    rl.question("Format: pay [addr] [amount]\n", async (command) => {
                        let [_, addr, amount] = command.split(' '); // Split input by space
                        const producerMA = multiaddr(addr);
                        try {
                            const stream = await node.dialProtocol(producerMA, '/fileExchange/1.0.2');
                            await payForChunk(stream, amount);
                        } catch (err) {console.log(err)}
                        displayOptions();
                    })
                    break;
                case '11':
                    rl.question("Format: register [username] [publicIP] [port] [price] [hash]\n", async (command) => {
                        let [_, username, publicIP, port, price, hash] = command.split(' '); // Split input by space
                        price = parseInt(price);
                        port = parseInt(port);
                        Producer.registerFile(hash, node.peerId.toString(), username, publicIP, port, price);
                        displayOptions();
                    })
                    break;
                case '12':
                    rl.question("Format: viewProducers [hash]\n", async (command) => {
                        let [_, hash] = command.split(' '); // Split input by space
                        Consumer.viewProducers(hash);
                        displayOptions();
                    })
                    break;
                case '13':
                    rl.question("Format: hash [fileName]\n", async (command) => {
                        let [_, fileName] = command.split(' '); // Split input by space
                        const filePath = join(__dirname, 'testProducerFiles/', fileName);
                        const fileContent = fs.readFileSync(filePath);
                        const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
                        console.log('Filehash: ', fileHash);
                        displayOptions();
                    })
                    break;
                case '_':
                    await node.stop();
                    console.log("Node has stopped");
                    console.log("Exiting...");
                    rl.close();
                    process.exit();
                default:
                    displayOptions();
            }
        });
    }
    displayOptions();
}
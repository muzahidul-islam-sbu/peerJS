import readline from 'readline';
import connectToGUI from './gui-connection.js';

/**
 * TODO:
 * -transfer files
 * -conduct a wallet transfer
 */
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
        console.log("8. Exit");

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
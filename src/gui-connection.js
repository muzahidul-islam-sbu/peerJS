// Setting up a websocket to exchange with the gui
import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

export default function connectToGUI() {
    const ws = new WebSocketServer({ port: 5174 }) // Server
    // const ws = new WebSocket('ws://localhost:5174'); // Client

    console.log("Now opening up websocket connection to GUI...")
    // When a client connects to the WebSocket server
    ws.on('connection', (ws) => {
        console.log('Client connected');

        // Handle requests from the GUI 
        ws.on('message', (message) => {
            console.log('Request: ', message.toString());
            if (message.toString() === 'GET_DATA') {
                console.log("received GET request")
                // If the message is 'GET_DATA', send the peer node information to the client
                console.log(discoveredPeers === local_peer_node_info.peerID)
                const ipRegex = /\/ip4\/([^\s/]+)/;
                const match = getMultiaddrs(test_node2)[1].match(ipRegex);
                const ipAddress = match && match[1];

                const portRegex = "//tcp/(\d+)/";
                const match2 = getMultiaddrs(test_node2)[1].match(portRegex);
                const portNumber = match2 && match2[1];
                let thing = null;
                // TODO: Update this peer id as needed
                discoveredPeers.forEach((peer) => {
                    // console.log(peer)
                    if(peer.location != null && peer.location.city != null && peer.location.city === 'Singapore') {
                        thing = peer;
                    }
                })
                
                const peerInfo = findPeerInfoByPeerId(discoveredPeers, "12D3KooWSXZGdoTXPaXS7SzrA1oN1BoYLByn9KghndmC1aV2s7hZ"); 
                const peerNodeInfo = {
                // Example peer node information
                id: thing.peerId, 
                address: "128.199.237.234",
                port: "96",
                location: thing.location
                };
        
                // Convert the peer node information to JSON and send it back to the client
                // ws.send(JSON.stringify(peerNodeInfo));
                // Send response with header type NODE_INFO
                ws.send(JSON.stringify({ type: 'NODE_INFO', data: peerNodeInfo }));
            }

            // if (parsedData.type === 'NODE_INFO') {
        });
        // Send a welcome message to the client
        ws.send('Welcome to the WebSocket server!');
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
}
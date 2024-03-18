import { WebSocketServer } from 'ws'; // Due to inorder of imports, WebSocket library is unavailable to us

// TODO: Replace this with database of peerIds
let peerIds = []
const wss = new WebSocketServer({ port: 9090 });

console.log("Trying to connect to client")
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received: ', message.toString());
    
    // Define a regular expression pattern to match the value of the "data" key
    const data = /"data":"([^"]+)"/;

    // Use the exec() method to search for the pattern in the JSON string
    const match = data.exec(message.toString());

    // Check if a match is found
    if (match && match.length > 1) {
      // The value is captured in the first capturing group (index 1)
      const dataValue = match[1];
      console.log("Extracted data value:", dataValue);
      peerIds.push(dataValue)
    } else {
      console.log("No match found");
    }

    // if (parsedData.type === 'NODE_INFO') {
  });

  ws.send(peerIds[0]); // Replace
  // ws.send(message.toString());
});


export default wss;
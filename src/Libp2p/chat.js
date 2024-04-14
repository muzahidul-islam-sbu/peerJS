import { pipe } from 'it-pipe'
import pkg from 'protobufjs';
const {load, Message} = pkg;
import * as fs from 'node:fs';
import * as path from 'node:path';

// Define your custom protocol ID
export const MY_PROTOCOL_ID = '/my-protocol/1.0.0';

// Implement protocol handlers
export const handleMyProtocolMessage = (peerId, message) => {
  // Handle incoming message for your protocol
  console.log(`Received message from ${peerId}:`, message);
};

// Export the handler function for use elsewhere if needed
export const handleMyProtocol = ({ stream, protocol }) => {
  // Handle incoming connections for your protocol
  console.log(`Received incoming connection for protocol ${protocol}`);
  pipe(
    stream,
    async function (source) {
      for await (const message of source) {
        handleMyProtocolMessage(stream.remotePeer, message);
      }
    }
  );
};

// Register protocol handlers with libp2p node
test_node2.handle('/chat/1.0.0', ({ stream, protocol }) => {
    console.log(`Received incoming connection for protocol ${protocol}`);
    stream.on('data', (data) => {
        handleChatMessage(stream.remotePeer, data);
    });
});


export function send (stream, filePath, node, addr) {
  
}

export async function handler(stream) {
  load("file.proto", async function(err, root) {
      if (err) throw err;

      const FileData = root.lookupType("package.FileData");
      let receivedData = Buffer.alloc(0); // Initialize an empty buffer to accumulate received data

      await pipe(
          stream,
          async function(source) {
              for await (const buffer of source) {
                for await (const buf of buffer){
                  console.log('buffer: ', buf);
                  receivedData = Buffer.concat([receivedData, buf]);
                }
              }
          }
      );
      console.log("data: ", receivedData);
      // Decode the received data
      const decoded = FileData.decode(receivedData);
      const fileName = decoded['filename'];
      const fileData = decoded['data'];

      // Write the file data to disk
      const filePath = path.join('./testConsumerFiles/', fileName);
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
      }
      fs.writeFile(filePath, fileData, (err) => {
          if (err) {
              console.error('Error saving file:', err);
              return;
          }
          console.log('File saved successfully:', filePath);
      });
  });
}
import { pipe } from 'it-pipe'
import pkg from 'protobufjs';
const {load, Message} = pkg;
import * as fs from 'node:fs';
import * as path from 'node:path';

export function send (stream, filePath, node, addr) {
  const MAX_CHUNK_SIZE = 65536; // Maximum chunk size
  // Read utf-8 from stdin
  load("file.proto", function(err, root) {
    if (err) throw err;
    
    const FileData = root.lookupType("package.FileData");
    const fileName = path.basename(filePath);
    //console.log('filepath:', filePath);


    fs.readFile(filePath, async (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return;
      }
      for (let i = 0; i < data.length; i += MAX_CHUNK_SIZE) {
        const chunk = data.subarray(i, i + MAX_CHUNK_SIZE);
        let message = FileData.create({
          filename: fileName,
          data: chunk
        })
        //console.log('filename:', fileName);
        let buffer = FileData.encode(message).finish();
        console.log(typeof buffer, buffer);
        // console.log(FileData.decode(buffer))
        await pipe(
          [ buffer ],
          stream,
          async function (source) {
            for await (const message of source) {
              console.info(`Me: ${String(message)}`)
            }
          }
        )
      }
      await node.hangUp(addr);
    })
  })
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
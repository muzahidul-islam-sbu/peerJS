import { pipe } from 'it-pipe'
import pkg from 'protobufjs';
const {load, Message} = pkg;
import * as fs from 'node:fs';
import * as path from 'node:path';

export function send (ind, isLastChunk, price, stream, filePath, node, addr) {
  const MAX_CHUNK_SIZE = 63000; // Maximum chunk size
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
      const chunk = data.subarray(ind * MAX_CHUNK_SIZE, (ind * MAX_CHUNK_SIZE) + MAX_CHUNK_SIZE);
        let message = FileData.create({
          filename: fileName,
          data: chunk,
          isLastChunk: isLastChunk,
          price: price
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
      await node.hangUp(addr);
    })
  })
}

export async function handler(stream, connection, bufferedFiles, emitter) {
  load("file.proto", async function(err, root) {
      if (err) throw err;

      const FileData = root.lookupType("package.FileData");
      // let receivedData = Buffer.alloc(0); // Initialize an empty buffer to accumulate received data

      await pipe(
          stream,
          async function(source) {
              for await (const message of source) {
                for await (const buffer of message) {

                  console.log('buffer: ', buffer, FileData.decode(buffer));
                  let fileName = FileData.decode(buffer)['filename'];
                  let isLastChunk  = FileData.decode(buffer)['isLastChunk']
                  let data = FileData.decode(buffer)['data']
                  let price = FileData.decode(buffer)['price']
                  
                  emitter.emit('receivedChunk', price, connection.remoteAddr)

                  if (!bufferedFiles.hasOwnProperty(fileName)) {
                    bufferedFiles[fileName] = Buffer.alloc(0);
                  }
                  bufferedFiles[fileName] = Buffer.concat([bufferedFiles[fileName], data]);
                  
                  if (isLastChunk) {
                    console.log("data: ", bufferedFiles[fileName]);
                    // Decode the received data
                    const fileData = bufferedFiles[fileName]
                    
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
                  }
                }
              }
            }
      );
  });
}
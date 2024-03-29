import { pipe } from 'it-pipe'
import pkg from 'protobufjs';
const {load, Message} = pkg;
import * as fs from 'node:fs';
import * as path from 'node:path';

export function send (stream, filePath, node, addr) {
  // Read utf-8 from stdin
  load("file.proto", function(err, root) {
    if (err) throw err;
    
    const FileData = root.lookupType("package.FileData");
    const fileName = path.basename(filePath);

    fs.readFile(filePath, async (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return;
      }
    
      // 'data' contains the contents of the file as a Buffer
      // Convert the Buffer to an ArrayBuffer
      var arraybuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      arraybuffer = Buffer.from(arraybuffer);
      let message = FileData.create({
        filename: fileName,
        data: arraybuffer
      });
      // console.log('ArrayBuffer:', arraybuffer, 'Message: ', message);

      let buffer = FileData.encode(message).finish();
      // console.log(typeof buffer, buffer);
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

export function handler (stream) {
  load("file.proto", async function(err, root) {
    if (err) throw err;
    
    const FileData = root.lookupType("package.FileData");
    await pipe(
      stream,
      async function (source) {
        for await (var buffer of source) {
          buffer = Buffer.concat(buffer.bufs);
          // console.log(typeof buffer, buffer);
          const decoded = FileData.decode(buffer);
          // console.log(typeof decoded, decoded);
          // const obj = Message.toObject(decoded);
          const fileName = decoded['filename'];
          const arrayBuffer = decoded['data'];
          
          const filePath = path.join('./testConsumerFiles/', fileName);
          fs.writeFile(filePath, arrayBuffer, (err) => {
            if (err) {
              console.error('Error saving file:', err);
              return;
            }
            console.log('File saved successfully:', filePath);
          });
        }
      }
    )
    await pipe([], stream);
  })
}

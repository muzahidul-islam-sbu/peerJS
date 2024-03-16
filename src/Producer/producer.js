// Loading in the proto and market server stuff
var PROTO_PATH = __dirname + '/../Market/market.proto';
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
var marketObject = grpc.loadPackageDefinition(packageDefinition).market;
// market is a stub -> allows us to call the protobuf service methods specified in the market server
var market = new marketObject.Market('localhost:50051', grpc.credentials.createInsecure());

// Library stuff
const fs = require('fs');

// Can just call Producer.(method they want)
// ex: Producer.registerFile("lsfli3394ljfdsj")
class Producer {
    /*
        Description:
            Tells the market we have this file and are willing to serve it for [bid]
        Parameters: 
            [String] hash -> the hash of the file you want to upload
            [Number] bid -> orcacoin producer wants in exchange
            [String] path -> absolute path of file producer wants to upload
        Returns:
            [true] on successful registration
            [false] otherwise
    */
    static registerFile(hash, uid, uname, uip, uport, uprice) {
        const userData = {
            id: uid,
            name: uname,
            ip: uip,
            port: uport,
            price: uprice
        };
        const args = {
            user: userData,
            fileHash: hash
        };

        market.registerFile(args, (error, response) => {
            if (error) {
                console.error('Error during []:', error);
                return false;
            } else {
                console.log('File registered successfully:', response);

                // might need to format the response
                // (need market methods to finalize first)

                // Add file to directory so that we can serve it on our server
                const destinationDirectory = './http_server_files';
                const originalFileName = path.basename(sourcePath);
                const destinationPath = path.join(destinationDirectory, originalFileName);
                fs.copyFileSync(sourcePath, destinationPath);

                return true;
            }
        });
    }

    /*
        Description:
            abc
        Parameters:
            abc
        Returns:
            abc
    */
    // static template(args) {
    //     const args = {
    //         abc: abc,
    //     };

    //     market.insertMarketMethodHere(args, (error, response) => {
    //         if (error) {
    //             console.error('Error during []:', error);
    //             return false;
    //         } else {
    //             console.log('success message:', response);

    //             // might need to format the response

    //             return true;
    //         }
    //     });
    // }
}

module.exports = { Producer };
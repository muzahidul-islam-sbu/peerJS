// Loading in the proto and market server stuff
var PROTO_PATH = __dirname + '/../../market.proto';
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
var marketObject = grpc.loadPackageDefinition(packageDefinition).MARKET;
// client is a stub -> allows us to call the protobuf service methods specified in the market server
var market = new marketObject.Market('localhost:50051/IP OF MARKET', grpc.credentials.createInsecure());
const fs = require('fs');

// UI can just call Producer.(method they want)
// ex: Producer.registerFile("lsfli3394ljfdsj")
export class Producer {
    /*
        Description:

        Parameters: 
            [String] hash -> the hash of the file you want to upload
            [Number] bid -> orcacoin producer wants in exchange
            [String] path -> absolute path of file producer wants to upload
        Returns:
            [true] on successful registration
            [false] otherwise
    */
    static registerFile(hash, bid, path) {
        const marketAskArgs = {
            identifier: hash,
            bid: bid,
        };
      
        // Call RegisterMarketAsk gRPC method
        market.RegisterMarketAsk(marketAskArgs, (error, response) => {
            if (error) {
                console.error('Error during RegisterMarketAsk:', error);
                return false;
            } else {
                console.log('File registered successfully:', response);

                // Start serving file at public http server
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
    static template(arg) {
        return;
    }
}

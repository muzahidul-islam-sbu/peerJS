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

const http = require('http');
const fs = require('fs');

// UI can just call Consumer.(method they want)
// ex: Consumer.viewProducers("lsfli3394ljfdsj")
export class Consumer {
    /*
        Description:
            Asks the market server to send all the producers currently
            serving the file.
        Parameters: 
            [String] hash -> the hash of the file you want
        Returns:
            a list of objects in the format MarketAsk

    */
    static viewProducers(hash) {
        var request = {
            identifier : hash
        }
        // Call ConsumerMarketQuery gRPC method
        // https://github.com/grpc/grpc-node/blob/@grpc/grpc-js@1.9.0/examples/routeguide/dynamic_codegen/route_guide_client.js
        // https://grpc.io/docs/languages/node/basics/
        market.ConsumerMarketQuery(request, (error, response) => {
            console.log('Producers for file hash:', response);
            // Get all of the producers
            return response.offers;
        });
    }

    /*  
        Description:
            Consumer selects a producer, downloads file, and finalizes transaction
        Parameters: 
            [Object] marketAsk -> MarketAsk object representing producer that consumer selected
        Returns:
            void
    */
    static selectProducer(marketAsk) {
        //currently skipping ProducerMarketQuery -> ProducerAcceptTransaction
        //neede more communication with market team
        market.ProducerAcceptTransaction(marketAsk, (error, response) => {
            if (error) {
                console.log("error", error.message);
                return;
            }
            
            console.log("Transaction ID: ", response.identifier);
        });
        
        // Download file
        const fileUrl = `http://${marketAsk.producerPubIP}/${marketAsk.identifier}`;
        const destinationDirectory = './http_server_files';
        const fileName = path.basename(fileUrl);
        const destinationPath = path.join(destinationDirectory, fileName);

        http.get(fileUrl, (response) => {
            if (response.statusCode === 200) {
              const fileStream = fs.createWriteStream(destinationPath);
              response.pipe(fileStream);
              fileStream.on('finish', () => {
                fileStream.close();
                console.log(`File downloaded to ${destinationPath}`);
              });
            } else {
              console.error(`Failed to download file. Status code: ${response.statusCode}`);
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
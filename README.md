# Orcacoin Peer Node JS

## How to call/run
```npm install```  
In your script file, add these lines and then you can call our methods with producer.METHOD or consumer.METHOD.
```
const producer = require('../Producer/producer.js').Producer;
const consumer = require('../Consumer/consumer.js').Consumer;
producer.registerFile("abc", 2, 3, 4, 5, 6);
consumer.viewProducers("abc");
```

## Consumer Methods
> Description:  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Asks the market server to send all the producers currently serving the file.  
> Parameters:  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] hash -> the hash of the file you want  
> Returns:  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[false] on query error  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[empty List] if no one is serving the file  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[List of Users in the format ]described in the protofi otherwise  

**viewProducers(hash)**

>Description:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Consumer downloads file, and finalizes transaction  
Parameters:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] producerIP -> Public IP of producer  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] hash -> Hash of the file  
Returns:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[true] If consumer succesfully downloaded file  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[false] otherwise  

**queryProducer(producerIP, hash)**

## Producer Methods
>Description:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Tells the market we have this file and are willing to serve it for [bid]  
Parameters:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] hash -> the hash of the file you want to upload  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Number] uid -> peer id  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] uname -> name of file  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Number] uip -> public IP to access producer HTTP server  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Number] uport -> port HTTP server is open on  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Number] uprice -> orcacoin producer wants in exchange  
Returns:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Nothing

**registerFile(hash, uid, uname, uip, uport, uprice)**

## Peer Node Connection to GUI
>Description:
JS websockets were used to create a server for every newly created node. This websocket server listens for requests from the GUI and responds to its requests with the appropriate peer ID, public key, private key, or other information about the peer node. 

Implementation for the websocket in the GUI project is currently stored in the DataTable.tsx
Clone and replace the DataTable.tsx file in https://github.com/GreenMarioX/CSE416-OrcaNet with the DataTable.tsx in this project.
webSocketService.js is an example of how to setup a server using JS websockets

HTTP API
* POST /uploadFile
```javascript
// Request Body JSON
{
    "filePath": "C:\\Users\\mm\\Documents\\6_4-6_17.pdf"
}
```
* POST /deleteFile
```javascript
// Request Body JSON
{
    "filePath": "C:\\Users\\mm\\Documents\\GitHub\\peerJS\\src\\testProducerFiles\\6_4-6_17.pdf"
}
```
* GET /getFileInfo?filePath={replace with file path}
```javascript
// Response Body JSON
{
    "fileName": "6_4-6_17.pdf",
    "filePath": "C:\\Users\\mm\\Documents\\GitHub\\peerJS\\src\\testProducerFiles\\6_4-6_17.pdf",
    "fileDate": "2024-04-14T21:33:37.498Z",
    "fileSize": 869694,  // Bytes
    "numberChunks": 14,
    "fileHash": "3e81a66c7a0b3f61cf9956abcc07dcee4c5f7f8db46041cafcc6b818975ca128"
}
```
* GET /getProducerFilesInfo
```javascript
// Response Body JSON
[
  {
      "fileName": "6_4-6_17.pdf",
      "filePath": "C:\\Users\\mm\\Documents\\GitHub\\peerJS\\src\\testProducerFiles\\6_4-6_17.pdf",
      "fileDate": "2024-04-14T21:33:37.498Z",
      "fileSize": 869694,  // Bytes
      "numberChunks": 14,
      "fileHash": "3e81a66c7a0b3f61cf9956abcc07dcee4c5f7f8db46041cafcc6b818975ca128"
  }
  ...
]
```


* POST /requestFileFromProducer
```javascript
// Request Body JSON
{ 
    "prodIp": "10.0.0.4", 
    "prodPort": 55444, 
    "prodId": "12D3KooWPQsCtFG81RVGHgzBC169iczzGEL9aJCtPdKctTY5H3sJ", 
    "fileHash": "3e81a66c7a0b3f61cf9956abcc07dcee4c5f7f8db46041cafcc6b818975ca128"
}
```

* GET /viewFileRequests
```javascript
// Response Body JSON
[
    {
        "addr": "/ip4/72.229.181.210/tcp/56742/p2p/12D3KooWQfFuEMfos9XmF8cGKCn6L2Y4FHVRskMc9gJ4QFQvZYGe",
        "fileHash": "3e81a66c7a0b3f61cf9956abcc07dcee4c5f7f8db46041cafcc6b818975ca128"
    }
    ...
]
```

* POST /sendFileToConsumer
```javascript
// Request Body JSON
{ 
    "addr": "/ip4/192.168.56.1/tcp/56026/p2p/12D3KooWAcL1ksq7tTANRouCeEiETzNcptMPDx9J3bXBZnSawfLj", 
    "fileHash": "3e81a66c7a0b3f61cf9956abcc07dcee4c5f7f8db46041cafcc6b818975ca128",
    "price": 2
}
```

* POST /payChunk
```javascript
// Request Body JSON
{ 
    "addr": "/ip4/192.168.56.1/tcp/56026/p2p/12D3KooWAcL1ksq7tTANRouCeEiETzNcptMPDx9J3bXBZnSawfLj", 
    "amount": 2
}
```

* POST /registerFile (In progress)
```javascript
// Request Body JSON
{ 
    "fileName": "tiger.jpg", 
    "username": "testuser",
    "price": 2
}
```

* POST /getProducersWithFile (In progress)

* GET /hashFile?filePath={replace with file path}
```javascript
// Response Body JSON
{
    "fileHash": "3e81a66c7a0b3f61cf9956abcc07dcee4c5f7f8db46041cafcc6b818975ca128"
}
```
## Peer-Server Methods
Add here.

# Orcacoin Peer Node JS
Currently, only registerFile() and viewProducers() work.

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
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Tell the market that we choose this specific producer  
Parameters:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] producerIP -> Public IP of producer  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] consumerIP -> Public IP of consumer  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] hash -> Hash of the file  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Number] bid -> Bid consumer agrees to pay  
Returns:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[true] If producer is ready for consumer's query  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[false] otherwise  

**selectProducer(producerIP, consumerIP, hash, bid)**

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

## Peer-Server Methods
Add here.

# Orcacoin Peer Node JS
Market protos and methods aren't finalized yet so we are making assumptions and using placeholder protobufs/method parameters for now.

## Consumer Methods
> Description:
> 
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Asks the market server to send all the producers currently serving the file.
> 
> Parameters:
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] hash -> the hash of the file you want
> Returns:
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[false] on query error
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[empty List] if no one is serving the file
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[List of producer IPs with their corresponding bid] otherwise

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
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Number] bid -> orcacoin producer wants in exchange
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[String] path -> absolute path of file producer wants to upload
Returns:
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[true] on successful registration
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[false] otherwise

**registerFile(hash, bid, path)**

## Producer-Server Methods
We have implementations from both JS teams so we need to choose one or merge them.

const Schema = require("../Market/market_pb.js");

const user1 = new Schema.User();
user1.setId(1001);
user1.setName("wzeng");
user1.setPort("8888");
console.log(user1.getName());

const producerModule = require('../Producer/producer.js')
const producer = producerModule.Producer;
producer.registerFile('hdsah', 2, 3, 4, 5, 6);


const consumerModule = require('../Consumer/consumer.js')
const consumer = consumerModule.Consumer;
consumer.viewProducers("hdsah");
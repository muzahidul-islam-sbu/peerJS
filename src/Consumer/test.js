

const producer = require('../Producer/producer.js').Producer;
producer.registerFile('hdsah', 2, 3, 4, 5, 6);


const consumer = require('../Consumer/consumer.js').Consumer;
consumer.viewProducers("hdsah");
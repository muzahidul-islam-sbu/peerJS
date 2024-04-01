import { Producer as producer } from '../Producer/producer.js';
import { Consumer as consumer } from '../Consumer/consumer.js';

producer.registerFile('hdsah', 2, 3, 4, 5, 6);
consumer.viewProducers("hdsah");
const Schema = require("../Market/market_pb.js");

const user1 = new Schema.User();
user1.setId(1001);
user1.setName("wzeng");
console.log(user1.getName());
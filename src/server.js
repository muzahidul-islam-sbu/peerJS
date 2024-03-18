class PeerNode {
  constructor(id, ipAddress, portNumber) {
    this.id = id;
    this.ipAddress = ipAddress;
    this.portNumber = portNumber;
  }
}

export class Node {
  constructor(uri, user) {
    this.uri = uri;
    this.user = user;
  }
}

const servers = [];

export function getNodes() {
  return [...servers];
}

export function addNode(node) {
  console.log(`registering ${node.user}`);
  const isAlreadyAdded = servers.find(existingNode => existingNode.user === node.user);
  if (isAlreadyAdded) return;
  servers.push(node);
}

export function getNodeByUser(user) {
  return servers.find(server => server.user === user);
}

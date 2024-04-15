

export default function propogateTransaction(msg) {
    const s = node.pubsub.getSubscribers('messages');
    debug('pubsub subscribers %O', s);
    node.pubsub.publish('messages', Buffer.from(msg));

    const nodes_pubsub_data = node.services.pubsub;
    console.log(nodes_pubsub_data)
    node.services.pubsub.publish('transaction', new TextEncoder().encode('123456789'))
    // console.lognodes_pubsub_data.getSubscriptions(peerId("12D3KooWBCKZMu1N2dgNK3dFgJztYFmkS1PL63RQujqhs34DXjCL")));
}
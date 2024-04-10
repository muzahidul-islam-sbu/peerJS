import { test_node } from "./libp2p.js"
import displayMenu from "./cli.js"

async function main() {
    displayMenu(null, test_node)
}

main()
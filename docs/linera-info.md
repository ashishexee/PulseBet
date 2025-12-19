

  
Hello, Linera
In this section, you will learn how to initialize a developer wallet, interact with the current Testnet, run a local development network, then compile and deploy your first application from scratch.

By the end of this section, you will have a microchain on the Testnet and/or on your local network, and a working application that can be queried using GraphQL.

Creating a wallet on the latest Testnet
To interact with the latest Testnet, you will need a developer wallet, a new microchain, and some tokens. These can be all obtained at once by querying the Testnet's faucet service as follows:

linera wallet init --faucet https://faucet.testnet-conway.linera.net
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net
If you obtain an error message instead, make sure to use a Linera toolchain compatible with the current Testnet.

Info

A Linera Testnet is a deployment of the Linera protocol used for testing. A deployment consists of a number of validators, each of which runs a frontend service (aka. linera-proxy), a number of workers (aka. linera-server), and a shared database (by default linera-storage-service).

Using a local test network
Another option is to start your own local development network. To do so, run the following command:

linera net up --with-faucet --faucet-port 8080
This will start a validator with the default number of shards and start a faucet.

Now, we're ready to create a developer wallet by running the following command in a separate shell:

linera wallet init --faucet http://localhost:8080
linera wallet request-chain --faucet http://localhost:8080
Note

A wallet is valid for the lifetime of its network. Every time a local network is restarted, the wallet needs to be removed and created again.

Working with several developer wallets and several networks
By default, the linera command looks for wallet files located in a configuration path determined by your operating system. If you prefer to choose the location of your wallet files, you may optionally set the variables LINERA_WALLET, LINERA_KEYSTORE and LINERA_STORAGE as follows:

DIR=$HOME/my_directory
mkdir -p $DIR
export LINERA_WALLET="$DIR/wallet.json"
export LINERA_KEYSTORE="$DIR/keystore.json"
export LINERA_STORAGE="rocksdb:$DIR/wallet.db"
Choosing such a directory can be useful to work with several networks because a wallet is always specific to the network where it was created.

Note

We refer to the wallets created by the linera CLI as "developer wallets" because they are operated from a developer tool and merely meant for testing and development.

Production-grade user wallets are generally operated by a browser extension, a mobile application, or a hardware device.

Interacting with the Linera network
To check that the network is working, you can synchronize your chain with the rest of the network and display the chain balance as follows:

linera sync
linera query-balance
You should see an output number, e.g. 10.

Building an example application
Applications running on Linera are Wasm bytecode. Each validator and client has a built-in Wasm virtual machine (VM) which can execute bytecode.

Let's build the counter application from the examples/ subdirectory of the Linera testnet branch:

cd examples/counter && cargo build --release --target wasm32-unknown-unknown
Publishing your application
You can publish the bytecode and create an application using it on your local network using the linera client's publish-and-create command and provide:

The location of the contract bytecode
The location of the service bytecode
The JSON encoded initialization arguments
linera publish-and-create \
  target/wasm32-unknown-unknown/release/counter_{contract,service}.wasm \
  --json-argument "42"
Congratulations! You've published your first application on Linera!

Querying your application
Now let's query your application to get the current counter value. To do that, we need to use the client running in service mode. This will expose a bunch of APIs locally which we can use to interact with applications on the network.

linera service --port 8080
Navigate to http://localhost:8080 in your browser to access GraphiQL, the GraphQL IDE. We'll look at this in more detail in a later section; for now, list the applications deployed on your default chain by running:

query {
  applications(chainId: "...") {
    id
    description
    link
  }
}
where ... are replaced by the chain ID shown by linera wallet show.

Since we've only deployed one application, the results returned have a single entry.

At the bottom of the returned JSON there is a field link. To interact with your application copy and paste the link into a new browser tab.

Finally, to query the counter value, run:

query {
  value
}
This will return a value of 42, which is the initialization argument we specified when deploying our application.


  
Microchains
This section provides an introduction to microchains, the main building block of the Linera Protocol. For a more formal treatment refer to the whitepaper.

Background
A microchain is a chain of blocks describing successive changes to a shared state. We will use the terms chain and microchain interchangeably. Linera microchains are similar to the familiar notion of blockchain, with the following important specificities:

An arbitrary number of microchains can coexist in a Linera network, all sharing the same set of validators and the same level of security. Creating a new microchain only takes one transaction on an existing chain.

The task of proposing new blocks in a microchain can be assumed either by validators or by end users (or rather their wallets) depending on the configuration of a chain. Specifically, microchains can be single-owner, multi-owner, or public, depending on who is authorized to propose blocks.

Cross-chain messaging
In traditional networks with a single blockchain, every transaction can access the application's entire execution state. This is not the case in Linera where the state of an application is spread across multiple microchains, and the state on any individual microchain is only affected by the blocks of that microchain.

Cross-chain messaging is a way for different microchains to communicate with each other asynchronously. This method allows applications and data to be distributed across multiple chains for better scalability. When an application on one chain sends a message to itself on another chain, a cross-chain request is created. These requests are implemented using remote procedure calls (RPCs) within the validators' internal network, ensuring that each request is executed only once.

Instead of immediately modifying the target chain, messages are placed first in the target chain's inbox. When an owner of the target chain creates its next block in the future, they may reference a selection of messages taken from the current inbox in the new block. This executes the selected messages and applies their messages to the chain state.

Below is an example set of chains sending asynchronous messages to each other over consecutive blocks.

                               ┌───┐     ┌───┐     ┌───┐
                       Chain A │   ├────►│   ├────►│   │
                               └───┘     └───┘     └───┘
                                                     ▲
                                           ┌─────────┘
                                           │
                               ┌───┐     ┌─┴─┐     ┌───┐
                       Chain B │   ├────►│   ├────►│   │
                               └───┘     └─┬─┘     └───┘
                                           │         ▲
                                           │         │
                                           ▼         │
                               ┌───┐     ┌───┐     ┌─┴─┐
                       Chain C │   ├────►│   ├────►│   │
                               └───┘     └───┘     └───┘
The Linera protocol allows receivers to discard messages but not to change the ordering of selected messages inside the communication queue between two chains. If a selected message fails to execute, the wallet will automatically reject it when proposing the receiver's block. The current implementation of the Linera client always selects as many messages as possible from inboxes, and never discards messages unless they fail to execute.

Chain ownership semantics
Active chains can have one or multiple owners. Chains with zero owners are permanently deactivated.

In Linera, the validators guarantee safety: On each chain, at each height, there is at most one unique block.

But liveness—actually adding blocks to a chain at all—relies on the owners. There are different types of rounds and owners, optimized for different use cases:

First an optional fast round, where a super owner can propose blocks that get confirmed with very particularly low latency, optimal for single-owner chains with no contention.
Then a number of multi-leader rounds, where all regular owners can propose blocks. This works well even if there is occasional, temporary contention: an owner using multiple devices, or multiple people using the same chain infrequently.
And finally single-leader rounds: These give each regular chain owner a time slot in which only they can propose a new block, without being hindered by any other owners' proposals. This is ideal for chains with many users that are trying to commit blocks at the same time.
The number of multi-leader rounds is configurable: On chains with fluctuating levels of activity, this allows the system to dynamically switch to single-leader mode whenever all multi-leader rounds fail during periods of high contention. Chains that very often have high activity from multiple owners can set the number of multi-leader rounds to 0.

For more detail and examples on how to open and close chains, see the wallet section on chain management

  
Wallets
As in traditional blockchains, Linera wallets are in charge of holding user private keys. However, instead of signing transactions, Linera wallets are meant to sign blocks and propose them to extend the chains owned by their users.

In practice, wallets include a node which tracks a subset of Linera chains. We will see in the next section how a Linera wallet can run a GraphQL service to expose the state of its chains to web frontends.

The command-line tool linera is the main way for developers to interact with a Linera network and manage the developer wallets present locally on the system.

Note that this command-line tool is intended mainly for development purposes. Our goal is that end users eventually manage their wallets in a browser extension.

Creating a developer wallet
The simplest way to obtain a wallet with the linera CLI tool is to run the following command:

linera wallet init --faucet $FAUCET_URL
linera wallet request-chain --faucet $FAUCET_URL
where $FAUCET_URL represents the URL of the network's faucet (see previous section)

Selecting a wallet
The private state of a wallet is conventionally stored in a file wallet.json, keys are stored in keystore.db, while the state of its node is stored in a file wallet.db.

To switch between wallets, you may use the --wallet, --keystore, and --storage options of the linera tool, e.g. as in linera --wallet wallet2.json --keystore keystore2.json --storage rocksdb:wallet2.db:runtime:default.

You may also define the environment variables LINERA_STORAGE, LINERA_KEYSTORE, and LINERA_WALLET to the same effect. E.g. LINERA_STORAGE=rocksdb:$PWD/wallet2.db:runtime:default and LINERA_WALLET=$PWD/wallet2.json.

Finally, if LINERA_STORAGE_$I, LINERA_KEYSTORE_$I, and LINERA_WALLET_$I are defined for some number I, you may call linera --with-wallet $I (or linera -w $I for short).

Chain management
Listing chains
To list the chains present in your wallet, you may use the command show:

linera wallet show
╭──────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────╮
│ Chain ID                                                         ┆ Latest Block                                                                         │
╞══════════════════════════════════════════════════════════════════╪══════════════════════════════════════════════════════════════════════════════════════╡
│ 668774d6f49d0426f610ad0bfa22d2a06f5f5b7b5c045b84a26286ba6bce93b4 ┆ Public Key:         3812c2bf764e905a3b130a754e7709fe2fc725c0ee346cb15d6d261e4f30b8f1 │
│                                                                  ┆ Owner:              c9a538585667076981abfe99902bac9f4be93714854281b652d07bb6d444cb76 │
│                                                                  ┆ Block Hash:         -                                                                │
│                                                                  ┆ Timestamp:          2023-04-10 13:52:20.820840                                       │
│                                                                  ┆ Next Block Height:  0                                                                │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ 91c7b394ef500cd000e365807b770d5b76a6e8c9c2f2af8e58c205e521b5f646 ┆ Public Key:         29c19718a26cb0d5c1d28102a2836442f53e3184f33b619ff653447280ccba1a │
│                                                                  ┆ Owner:              efe0f66451f2f15c33a409dfecdf76941cf1e215c5482d632c84a2573a1474e8 │
│                                                                  ┆ Block Hash:         51605cad3f6a210183ac99f7f6ef507d0870d0c3a3858058034cfc0e3e541c13 │
│                                                                  ┆ Timestamp:          2023-04-10 13:52:21.885221                                       │
│                                                                  ┆ Next Block Height:  1                                                                │
╰──────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────╯

Each row represents a chain present in the wallet. On the left is the unique identifier on the chain, and on the right is metadata for that chain associated with the latest block.

Default chain
Each wallet has a default chain that all commands apply to unless you specify another --chain on the command line.

The default chain is set initially, when the first chain is added to the wallet. You can check the default chain for your wallet by running:

linera wallet show
The chain ID which is in green text instead of white text is your default chain.

To change the default chain for your wallet, use the set-default command:

linera wallet set-default <chain-id>
Creating chains
In the Linera protocol, chains are generally created using a transaction from an existing chain.

Create a chain from an existing one for your own wallet
To create a new chain from the default chain of your wallet, you can use the open-chain command:

linera open-chain
This will create a new chain and add it to the wallet. Use the wallet show command to see your existing chains.

Create a new chain from an existing one for another wallet
Creating a chain for another wallet requires an extra two steps. Let's initialize a second wallet:

linera --wallet wallet2.json --storage rocksdb:linera2.db wallet init --faucet $FAUCET_URL
First wallet2 must create an unassigned keypair. The public part of that keypair is then sent to the wallet who is the chain creator.

linera --wallet wallet2.json keygen
6443634d872afbbfcc3059ac87992c4029fa88e8feb0fff0723ac6c914088888 # this is the public key for the unassigned keypair
Next, using the public key, wallet can open a chain for wallet2.

linera open-chain --to-public-key 6443634d872afbbfcc3059ac87992c4029fa88e8feb0fff0723ac6c914088888
e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65010000000000000000000000
fc9384defb0bcd8f6e206ffda32599e24ba715f45ec88d4ac81ec47eb84fa111
The first line is the message ID specifying the cross-chain message that creates the new chain. The second line is the new chain's ID.

Finally, to add the chain to wallet2 for the given unassigned key we use the assign command:

 linera --wallet wallet2.json assign --key 6443634d872afbbfcc3059ac87992c4029fa88e8feb0fff0723ac6c914088888 --message-id e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65010000000000000000000000
Note that in the case of a test network with a faucet, the new wallet and the new chain could also have been created from the faucet directly using:

linera --wallet wallet2.json --storage rocksdb:linera2.db wallet init --faucet $FAUCET_URL
linera --wallet wallet2.json --storage rocksdb:linera2.db wallet request-chain --faucet $FAUCET_URL
Opening a chain with multiple users
The open-chain command is a simplified version of open-multi-owner-chain, which gives you fine-grained control over the set and kinds of owners and rounds for the new chain, and the timeout settings for the rounds. E.g. this creates a chain with two owners and two multi-leader rounds.

linera open-multi-owner-chain \
    --chain-id e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65010000000000000000000000 \
    --owner-public-keys 6443634d872afbbfcc3059ac87992c4029fa88e8feb0fff0723ac6c914088888 \
                        ca909dcf60df014c166be17eb4a9f6e2f9383314a57510206a54cd841ade455e \
    --multi-leader-rounds 2
The change-ownership command offers the same options to add or remove owners and change round settings for an existing chain.

Node Service
So far we've seen how to use the Linera client treating it as a binary in your terminal. However, the client also acts as a node which:

Executes blocks
Exposes a GraphQL API and IDE for dynamically interacting with applications and the system
Listens for notifications from validators and automatically updates local chains.
To interact with the node service, run linera in service mode:

linera service
This will run the node service on port 8080 by default (this can be overridden using the --port flag).

A note on GraphQL
Linera uses GraphQL as the query language for interfacing with different parts of the system. GraphQL enables clients to craft queries such that they receive exactly what they want and nothing more.

GraphQL is used extensively during application development, especially to query the state of an application from a front-end for example.

To learn more about GraphQL check out the official docs.

GraphiQL IDE
Conveniently, the node service exposes a GraphQL IDE called GraphiQL. To use GraphiQL start the node service and navigate to localhost:8080/.

Using the schema explorer on the left of the GraphiQL IDE you can dynamically explore the state of the system and your applications.

graphiql.png

GraphQL system API
The node service also exposes a GraphQL API which corresponds to the set of system operations. You can explore the full set of operations by clicking on MutationRoot.

GraphQL application API
To interact with an application, we run the Linera client in service mode. It exposes a GraphQL API for every application running on any owned chain at localhost:8080/chains/<chain-id>/applications/<application-id>.

Navigating there with your browser will open a GraphiQL interface which enables you to graphically explore the state of your application.

Connecting AI agents to Linera applications in MCP
Most AI agents understand the Model Context Protocol (MCP for short).

GraphQL service can be turned an MCP server using Apollo MCP Server.

More information can be found in the mcp-demo repository.
  
Applications
The programming model of Linera is designed so that developers can take advantage of microchains to scale their applications.

Linera uses the WebAssembly (Wasm) Virtual Machine to execute user applications. Currently, the Linera SDK is focused on the Rust programming language for the backend and TypeScript for the frontend.

Linera applications are structured using the familiar notion of Rust crate: the external interfaces of an application (including instantiation parameters, operations and messages) generally go into the library part of its crate, while the core of each application is compiled into binary files for the Wasm architecture.

The Application deployment lifecycle
Linera Applications are designed to be powerful yet re-usable. For this reason there is a distinction between the bytecode and an application instance on the network.

Applications undergo a lifecycle transition aimed at making development easy and flexible:

The bytecode is built from a Rust project with the linera-sdk dependency.
The bytecode is published to the network on a microchain, and assigned an identifier.
A user can create a new application instance, by providing the bytecode identifier and instantiation arguments. This process returns an application identifier which can be used to reference and interact with the application.
The same bytecode identifier can be used as many times needed by as many users needed to create distinct applications.
Importantly, the application deployment lifecycle is abstracted from the user, and an application can be published with a single command:

linera publish-and-create <contract-path> <service-path> <init-args>
This will publish the bytecode as well as instantiate the application for you.

Anatomy of an application
An application is broken into two major components, the contract and the service.

The contract is gas-metered, and is the part of the application which executes operations and messages, make cross-application calls and modifies the application's state. The details are covered in more depth in the application backend guide.

The service is non-metered and read-only. It is used primarily to query the state of an application and populate the presentation layer (think front-end) with the data required for a user interface.

Operations and messages
For this section we'll be using a simplified version of the example application called "fungible" where users can send tokens to each other.

At the system-level, interacting with an application can be done via operations and messages.

Operations are defined by an application developer and each application can have a completely different set of operations. Chain owners then actively create operations and put them in their block proposals to interact with an application. Other applications may also call the application by providing an operation for it to execute, this is called a cross-application call and always happens within the same chain. Operations for cross-application calls may return a response value back to the caller.

Taking the "fungible token" application as an example, an operation for a user to transfer funds to another user would look like this:

#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    /// A transfer from a (locally owned) account to a (possibly remote) account.
    Transfer {
        owner: AccountOwner,
        amount: Amount,
        target_account: Account,
    },
    // Meant to be extended here
}
Messages result from the execution of operations or other messages. Messages can be sent from one chain to another, always within the same application. Block proposers also actively include messages in their block proposal, but unlike with operations, they are only allowed to include them in the right order (possibly skipping some), and only if they were actually created by another chain (or by a previous block of the same chain). Messages that originate from the same transaction are included as a single transaction in the receiving block.

In our "fungible token" application, a message to credit an account would look like this:

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    Credit { owner: AccountOwner, amount: Amount },
    // Meant to be extended here
}
Messages can be marked as tracked by their sender. When a tracked message is rejected, the message is marked as bouncing and sent back to the sender chain. This is useful to avoid dropping assets in case the receiver is not able or wanting to accept them.

Composing applications
Within a chain, Linera applications call each other synchronously. The transactions of a block initiates the first call to an application. The atomicity of message bundles ensures that the messages created by a transaction are either all received or all rejected by the receiver chain.

The following example shows a common design pattern where a high-level application (here, a crowd-funding app) calls into another application (here an ERC-20-like application managing a fungible token), resulting in a bundle of two messages.

Crowdfunding app chain

User chain

Execution state

Execution state

calls (with signer) (1)

calls (with signer) (2)

calls (7)

send pledge (4)

send assets (3)

receive pledge (6)

receive assets (5)

operation in block

crowdfunding app

fungible token app

crowdfunding app

fungible token app

Incoming message bundle
[assets, pledge]

When a user proposes a block in their user chain, operations inherit the authentication of the user (aka signer or origin) that signed the block. Calls may optionally forward this authentication, for instance to allow the transfer of assets.

Authentication
Operations in a block are always authenticated and messages may be authenticated. The signer of a block becomes the authenticator of all the operations in that block. As operations are being executed by applications, messages can be created to be sent to other chains. When they are created, they can be configured to be authenticated. In that case, the message receives the same authentication as the operation that created it. If handling an incoming message creates new messages, those may also be configured to have the same authentication as the received message.

In other words, the block signer can have its authority propagated across chains through series of messages. This allows applications to safely store user state on chains that the user may not have the authority to produce blocks. The application may also allow only the authorized user to change that state, and not even the chain owner is able to override that.

The figure below shows four chains (A, B, C, D) and some blocks produced in them. In this example, each chain is owned by a single owner (aka. address). Owners are in charge of producing blocks and sign new blocks using their signing keys. Some blocks show the operations and incoming messages they accept, where the authentication is shown inside parenthesis. All operations produced are authenticated by the block proposer, and if these are all single user chains, the proposer is always the chain owner. Messages that have authentication use the one from the operation or message that created it.

One example in the figure is that chain A produced a block with Operation 1, which is authenticated by the owner of chain A (written (a)). That operation sent a message to chain B, and assuming the message was sent with the authentication forwarding enabled, it is received and executed in chain B with the authentication of (a). Another example is that chain D produced a block with Operation 2, which is authenticated by the owner of chain D (written (d)). That operation sent a message to chain C, which is executed with authentication of (d) like the example before. Handling that message in chain C produced a new message, which was sent to chain B. That message, when received by chain B is executed with the authentication of (d).

                            ┌───┐     ┌─────────────────┐     ┌───┐
       Chain A owned by (a) │   ├────►│ Operation 1 (a) ├────►│   │
                            └───┘     └────────┬────────┘     └───┘
                                               │
                                               └────────────┐
                                                            ▼
                                                ┌──────────────────────────┐
                            ┌───┐     ┌───┐     │ Message from chain A (a) │
       Chain B owned by (b) │   ├────►│   ├────►│ Message from chain C (d) |
                            └───┘     └───┘     │ Operation 3 (b)          │
                                                └──────────────────────────┘
                                                            ▲
                                                   ┌────────┘
                                                   │
                            ┌───┐     ┌──────────────────────────┐     ┌───┐
       Chain C owned by (c) │   ├────►│ Message from chain D (d) ├────►│   │
                            └───┘     └──────────────────────────┘     └───┘
                                                 ▲
                                     ┌───────────┘
                                     │
                            ┌─────────────────┐     ┌───┐     ┌───┐
       Chain D owned by (d) │ Operation 2 (d) ├────►│   ├────►│   │
                            └─────────────────┘     └───┘     └───┘
An example where this is used is in the Fungible application, where a Claim operation allows retrieving money from a chain the user does not control (but the user still trusts will produce a block receiving their message). Without the Claim operation, users would only be able to store their tokens on their own chains, and multi-owner and public chains would have their tokens shared between anyone able to produce a block.

With the Claim operation, users can store their tokens on another chain where they're able to produce blocks or where they trust the owner will produce blocks receiving their messages. Only they are able to move their tokens, even on chains where ownership is shared or where they are not able to produce blocks.

x1.00

  
Common Design Patterns
We now explore some common design patterns to take advantage of microchains.

Applications with only user chains
Some applications such as payments only require user chains, hence are fully horizontally scalable:

Validators

initiates transfer

sends assets

notifies

user 1

user chain 1

user chain 2

user 2

Example: the fungible demo application of the Linera codebase.

Client/server applications
Pre-existing applications (e.g. written in Solidity) generally run on a single chain of blocks for all users. Those can be embedded in an app chain to act as a service.

Validators

initiates request

initiate response(s)

notifies

notifies

sends request

sends response

user 1

user chain 1

block producer

app chain

user chain 2

Depending on the nature of the application, the blocks produced in the app chain may be restricted to only contain messages (no operations). This is to ensure that block producers have no influence on a chain, other than selecting incoming messages.

Example: the crowd-funding demo application of the Linera codebase.

Using personal chains to scale applications
User chains are useful to store the assets of their users and initiate requests to app chains. Yet, oftentimes, they can also help applications scale horizontally by taking work out of the app chains.

Microchains

submits ZK proof

sends trusted message《ZK proof is valid》

sends tokens

user 1

user chain 1

airdrop chain

user chain 2

One of the benefits of personal chains is to enable transactions that would be too slow or not deterministic enough for traditional blockchains, including:

Validating ZK proofs,
Sending web queries to external oracle services (e.g. AI inference) and other API providers,
Downloading data blobs from external data availability (”DA”) layers and computing app-specific invariants.
Example (unfinished): the airdrop demo application of the Linera project.

Using temporary chains to scale applications
Temporary chains can be created on demand and configured to accept blocks from specific users.

The following diagram allows a virtually unlimited number of games (e.g. chess game) to be spawned for a given tournament.

Microchains

creates

reports result

request game

request game

plays

plays

user chain 1

tournament app chain

user chain 2

temporary game chain

user 1

user 2

Example: the hex-game demo application of the Linera codebase.

Just-in-time oracles
We have seen that Linera clients are connected and don’t rely on external RPC providers to read on-chain data from the chain. This ability to receive secure, censorship-resistant notifications and read data from the network is a game changer allowing on-chain applications to query certain clients in real time.

For instance, clients may be running an AI oracle off-chain in a trusted execution environment (TEE), allowing on-chain application to extract important information form the Internet.

Oracle TEE

Validators

oracle response

oracle query

notifies

submit response

oracle chain

app chain

oracle client

AI oracle

Web


  
Creating a Linera Project
To create your Linera project, use the linera project new command. The command should be executed outside the linera-protocol folder. It sets up the scaffolding and requisite files:

linera project new my-counter
linera project new bootstraps your project by creating the following key files:

Cargo.toml: your project's manifest filled with the necessary dependencies to create an app;
rust-toolchain.toml: a file with configuration for Rust compiler.
NOTE: currently the latest Rust version compatible with our network is 1.86.0. Make sure it's the one used by your project.

src/lib.rs: the application's ABI definition;
src/state.rs: the application's state;
src/contract.rs: the application's contract, and the binary target for the contract bytecode;
src/service.rs: the application's service, and the binary target for the service bytecode.
When writing Linera applications it is a convention to use your app's name as a prefix for names of trait, struct, etc. Hence, in the following manual, we will use CounterContract, CounterService, etc.

  
Creating the Application State
The state of a Linera application consists of onchain data that are persisted between transactions.

The struct which defines your application's state can be found in src/state.rs. To represent our counter, we're going to use a u64 integer.

While we could use a plain data-structure for the entire application state:

struct Counter {
  value: u64
}
in general, we prefer to manage persistent data using the concept of "views":

Views allow an application to load persistent data in memory and stage modifications in a flexible way.

Views resemble the persistent objects of an ORM framework, except that they are stored as a set of key-value pairs (instead of a SQL row).

In this case, the struct in src/state.rs should be replaced by

/// The application state.
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct Counter {
    pub value: RegisterView<u64>,
    // Additional fields here will get their own key in storage.
}
and the occurrences of Application in the rest of the project should be replaced by Counter.

The derive macro async_graphql::SimpleObject is related to GraphQL queries discussed in the next section.

A RegisterView<T> supports modifying a single value of type T. Other data structures available in the library linera_views include:

LogView for a growing vector of values;
QueueView for queues;
MapView and CollectionView for associative maps; specifically, MapView in the case of static values, and CollectionView when values are other views.
For an exhaustive list of the different constructions, refer to the crate documentation.


Defining the ABI
The Application Binary Interface (ABI) of a Linera application defines how to interact with this application from other parts of the system. It includes the data structures, data types, and functions exposed by on-chain contracts and services.

ABIs are usually defined in src/lib.rs and compiled across all architectures (Wasm and native).

For a reference guide, check out the documentation of the crate.

Defining a marker struct
The library part of your application (generally in src/lib.rs) must define a public empty struct that implements the Abi trait.

struct CounterAbi;
The Abi trait combines the ContractAbi and ServiceAbi traits to include the types that your application exports.

/// A trait that includes all the types exported by a Linera application (both contract
/// and service).
pub trait Abi: ContractAbi + ServiceAbi {}
Next, we're going to implement each of the two traits.

Contract ABI
The ContractAbi trait defines the data types that your application uses in a contract. Each type represents a specific part of the contract's behavior:

/// A trait that includes all the types exported by a Linera application contract.
pub trait ContractAbi {
    /// The type of operation executed by the application.
    ///
    /// Operations are transactions directly added to a block by the creator (and signer)
    /// of the block. Users typically use operations to start interacting with an
    /// application on their own chain.
    type Operation: Serialize + DeserializeOwned + Send + Sync + Debug + 'static;

    /// The response type of an application call.
    type Response: Serialize + DeserializeOwned + Send + Sync + Debug + 'static;

    /// How the `Operation` is deserialized
    fn deserialize_operation(operation: Vec<u8>) -> Result<Self::Operation, String> {
        bcs::from_bytes(&operation)
            .map_err(|e| format!("BCS deserialization error {e:?} for operation {operation:?}"))
    }

    /// How the `Operation` is serialized
    fn serialize_operation(operation: &Self::Operation) -> Result<Vec<u8>, String> {
        bcs::to_bytes(operation)
            .map_err(|e| format!("BCS serialization error {e:?} for operation {operation:?}"))
    }

    /// How the `Response` is deserialized
    fn deserialize_response(response: Vec<u8>) -> Result<Self::Response, String> {
        bcs::from_bytes(&response)
            .map_err(|e| format!("BCS deserialization error {e:?} for response {response:?}"))
    }

    /// How the `Response` is serialized
    fn serialize_response(response: Self::Response) -> Result<Vec<u8>, String> {
        bcs::to_bytes(&response)
            .map_err(|e| format!("BCS serialization error {e:?} for response {response:?}"))
    }
}
All these types must implement the Serialize, DeserializeOwned, Send, Sync, Debug traits, and have a 'static lifetime.

In our example, we would like to change our Operation to u64, like so:

pub struct CounterAbi;

impl ContractAbi for CounterAbi {
    type Operation = u64;
    type Response = u64;
}
Service ABI
The ServiceAbi is in principle very similar to the ContractAbi, just for the service component of your application.

The ServiceAbi trait defines the types used by the service part of your application:

/// A trait that includes all the types exported by a Linera application service.
pub trait ServiceAbi {
    /// The type of a query receivable by the application's service.
    type Query: Serialize + DeserializeOwned + Send + Sync + Debug + 'static;

    /// The response type of the application's service.
    type QueryResponse: Serialize + DeserializeOwned + Send + Sync + Debug + 'static;
}
For our Counter example, we'll be using GraphQL to query our application so our ServiceAbi should reflect that:

use async_graphql::{Request, Response};

impl ServiceAbi for CounterAbi {
    type Query = Request;
    type QueryResponse = Response;
}
References
The full trait definition of Abi can be found here.

The full Counter example application can be found here.
  
Writing the Contract Binary
The contract binary is the first component of a Linera application. It can actually change the state of the application.

To create a contract, we need to create a new type and implement the Contract trait for it, which is as follows:


pub trait Contract: WithContractAbi + ContractAbi + Sized {
    /// The type of message executed by the application.
    type Message: Serialize + DeserializeOwned + Debug;

    /// Immutable parameters specific to this application (e.g. the name of a token).
    type Parameters: Serialize + DeserializeOwned + Clone + Debug;

    /// Instantiation argument passed to a new application on the chain that created it
    /// (e.g. an initial amount of tokens minted).
    type InstantiationArgument: Serialize + DeserializeOwned + Debug;

    /// Event values for streams created by this application.
    type EventValue: Serialize + DeserializeOwned + Debug;

    /// Creates an in-memory instance of the contract handler.
    async fn load(runtime: ContractRuntime<Self>) -> Self;

    /// Instantiates the application on the chain that created it.
    async fn instantiate(&mut self, argument: Self::InstantiationArgument);

    /// Applies an operation from the current block.
    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response;

    /// Applies a message originating from a cross-chain message.
    async fn execute_message(&mut self, message: Self::Message);

    /// Reacts to new events on streams.
    ///
    /// This is called whenever there is a new event on any stream that this application
    /// subscribes to.
    async fn process_streams(&mut self, _updates: Vec<StreamUpdate>) {}

    /// Finishes the execution of the current transaction.
    async fn store(self);
}
There's quite a bit going on here, so let's break it down and take one method at a time.

For this application, we'll be using the load, execute_operation and store methods.

The contract lifecycle
To implement the application contract, we first create a type for the contract:

linera_sdk::contract!(CounterContract);

pub struct CounterContract {
    state: CounterState,
    runtime: ContractRuntime<Self>,
}
This type usually contains at least two fields: the persistent state defined earlier and a handle to the runtime. The runtime provides access to information about the current execution and also allows sending messages, among other things. Other fields can be added, and they can be used to store volatile data that only exists while the current transaction is being executed, and discarded afterwards.

When a transaction is executed, the contract type is created through a call to Contract::load method. This method receives a handle to the runtime that the contract can use, and should use it to load the application state. For our implementation, we will load the state and create the CounterContract instance:

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = CounterState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        CounterContract { state, runtime }
    }
When the transaction finishes executing successfully, there's a final step where all loaded application contracts are called in order to do any final checks and persist its state to storage. That final step is a call to the Contract::store method, which can be thought of as similar to executing a destructor. In our implementation we will persist the state back to storage:

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
It's possible to do more than just saving the state, and the Contract finalization section provides more details on that.

Instantiating our Application
The first thing that happens when an application is created from a bytecode is that it is instantiated. This is done by calling the contract's Contract::instantiate method.

Contract::instantiate is only called once when the application is created and only on the microchain that created the application.

Deployment on other microchains will use the Default value of all sub-views in the state if the state uses the view paradigm.

For our example application, we'll want to initialize the state of the application to an arbitrary number that can be specified on application creation using its instantiation parameters:

    async fn instantiate(&mut self, value: u64) {
        // Validate that the application parameters were configured correctly.
        self.runtime.application_parameters();

        self.state.value.set(value);
    }
Implementing the increment operation
Now that we have our counter's state and a way to initialize it to any value we would like, we need a way to increment our counter's value. Execution requests from block proposers or other applications are broadly called 'operations'.

To handle an operation, we need to implement the Contract::execute_operation method. In the counter's case, the operation it will be receiving is a u64 which is used to increment the counter by that value:

    async fn execute_operation(&mut self, operation: u64) -> u64 {
        let new_value = self.state.value.get() + operation;
        self.state.value.set(new_value);
        new_value
    }
Declaring the ABI
Finally, we link our Contract trait implementation with the ABI of the application:

impl WithContractAbi for CounterContract {
    type Abi = CounterAbi;
}
References
The full trait definition of Contract can be found here.

The full Counter example application can be found here.

  
Writing the Service Binary
The service binary is the second component of a Linera application. It is compiled into a separate Bytecode from the contract and is run independently. It is not metered (meaning that querying an application's service does not consume gas), and can be thought of as a read-only view into your application.

Application states can be arbitrarily complex, and most of the time you don't want to expose this state in its entirety to those who would like to interact with your app. Instead, you might prefer to define a distinct set of queries that can be made against your application.

The Service trait is how you define the interface into your application. The Service trait is defined as follows:


pub trait Service: WithServiceAbi + ServiceAbi + Sized {
    /// Immutable parameters specific to this application.
    type Parameters: Serialize + DeserializeOwned + Send + Sync + Clone + Debug + 'static;

    /// Creates an in-memory instance of the service handler.
    async fn new(runtime: ServiceRuntime<Self>) -> Self;

    /// Executes a read-only query on the state of this application.
    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse;
}
Let's implement Service for our counter application.

First, we create a new type for the service, similarly to the contract:

linera_sdk::service!(CounterService);

pub struct CounterService {
    state: CounterState,
    runtime: Arc<ServiceRuntime<Self>>,
}
Just like with the CounterContract type, this type usually has two types: the application state and the runtime. We can omit the fields if we don't use them, so in this example we're omitting the runtime field, since its only used when constructing the CounterService type.

As before, the macro service! generates the necessary boilerplate for implementing the service WIT interface, exporting the necessary resource types and functions so that the service can be executed.

Next, we need to implement the Service trait for CounterService type. The first step is to define the Service's associated type, which is the global parameters specified when the application is instantiated. In our case, the global parameters aren't used, so we can just specify the unit type:

impl Service for CounterService {
    type Parameters = ();

    // ...
}
Also like in contracts, we must implement a load constructor when implementing the Service trait. The constructor receives the runtime handle and should use it to load the application state:

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = CounterState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        CounterService {
            state,
            runtime: Arc::new(runtime),
        }
    }
Services don't have a store method because they are read-only and can't persist any changes back to the storage.

The actual functionality of the service starts in the handle_query method. We will accept GraphQL queries and handle them using the async-graphql crate. To forward the queries to custom GraphQL handlers we will implement in the next section, we use the following code:

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            QueryRoot {
                value: *self.state.value.get(),
            },
            MutationRoot {
                runtime: self.runtime.clone(),
            },
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
Finally, as before, the following code is needed to incorporate the ABI definitions into your Service implementation:

impl WithServiceAbi for CounterService {
    type Abi = counter::CounterAbi;
}
Adding GraphQL compatibility
Finally, we want our application to have GraphQL compatibility. To achieve this we need a QueryRoot to respond to queries and a MutationRoot for creating serialized Operation values that can be placed in blocks.

In the QueryRoot, we only create a single value query that returns the counter's value:

struct QueryRoot {
    value: u64,
}

#[Object]
impl QueryRoot {
    async fn value(&self) -> &u64 {
        &self.value
    }
}
In the MutationRoot, we only create one increment method that returns a serialized operation to increment the counter by the provided value:

struct MutationRoot {
    runtime: Arc<ServiceRuntime<CounterService>>,
}

#[Object]
impl MutationRoot {
    async fn increment(&self, value: u64) -> [u8; 0] {
        self.runtime.schedule_operation(&value);
        []
    }
}
We haven't included the imports in the above code. If you want the full source code and associated tests check out the examples section on GitHub.

References
The full trait definition of Service can be found here.

The full Counter example application can be found here.

x1.00




Welcome
The Linera Protocol
Overview
Roadmap
Developers
Getting Started
Core Concepts
Writing Backends
Creating a Project
Creating the Application State
Defining the ABI
Writing the Contract Binary
Writing the Service Binary
Deploying the Application
Cross-Chain Messages
Calling other Applications
Using Data Blobs
Printing Logs from an Application
Writing Tests
Writing Frontends
Advanced Topics
Experimental
Node Operators
Devnets
Testnets
Glossary

  
Deploying the Application
The first step to deploy your application is to configure a wallet. This will determine where the application will be deployed: either to a local net or to the public deployment (i.e. a devnet or a testnet).

Local network
To configure the local network, follow the steps in the Getting Started section.

Afterwards, the LINERA_WALLET, LINERA_STORAGE, LINERA_KEYSTORE environment variables should be set and can be used in the publish-and-create command to deploy the application while also specifying:

The location of the contract bytecode
The location of the service bytecode
The JSON encoded initialization arguments
linera publish-and-create \
  target/wasm32-unknown-unknown/release/my_counter_{contract,service}.wasm \
  --json-argument "42"
Devnets and Testnets
To configure the wallet for the current testnet while creating a new microchain, the following command can be used:

linera wallet init --faucet https://faucet.testnet-conway.linera.net
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net
The Faucet will provide the new chain with some tokens, which can then be used to deploy the application with the publish-and-create command. It requires specifying:

The location of the contract bytecode
The location of the service bytecode
The JSON encoded initialization arguments
linera publish-and-create \
  target/wasm32-unknown-unknown/release/my_counter_{contract,service}.wasm \
  --json-argument "42"
Interacting with the application
To interact with the deployed application, a node service must be used.

x1.00




Welcome
The Linera Protocol
Overview
Roadmap
Developers
Getting Started
Core Concepts
Writing Backends
Creating a Project
Creating the Application State
Defining the ABI
Writing the Contract Binary
Writing the Service Binary
Deploying the Application
Cross-Chain Messages
Calling other Applications
Using Data Blobs
Printing Logs from an Application
Writing Tests
Writing Frontends
Advanced Topics
Experimental
Node Operators
Devnets
Testnets
Glossary

  
Cross-Chain Messages
On Linera, applications are meant to be multi-chain: They are instantiated on every chain where they are used. An application has the same application ID and bytecode everywhere, but a separate state on every chain. To coordinate, the instances can send cross-chain messages to each other. A message sent by an application is always handled by the same application on the target chain: The handling code is guaranteed to be the same as the sending code, but the state may be different.

For your application, you can specify any serializable type as the Message type in your Contract implementation. To send a message, use the ContractRuntime made available as an argument to the contract's Contract::load constructor. The runtime is usually stored inside the contract object, as we did when writing the contract binary. We can then call ContractRuntime::prepare_message to start preparing a message, and then send_to to send it to a destination chain.

    self.runtime
        .prepare_message(message_contents)
        .send_to(destination_chain_id);
After block execution in the sending chain, sent messages are placed in the target chains' inboxes for processing. There is no guarantee that it will be handled: For this to happen, an owner of the target chain needs to include it in the incoming_messages in one of their blocks. When that happens, the contract's execute_message method gets called on their chain.

While preparing the message to be sent, it is possible to enable authentication forwarding and/or tracking. Authentication forwarding means that the message is executed by the receiver with the same authenticated signer as the sender of the message, while tracking means that the message is sent back to the sender if the receiver rejects it. The example below enables both flags:

    self.runtime
        .prepare_message(message_contents)
        .with_tracking()
        .with_authentication()
        .send_to(destination_chain_id);
Example: fungible token
In the fungible example application, such a message can be the transfer of tokens from one chain to another. If the sender includes a Transfer operation on their chain, it decreases their account balance and sends a Credit message to the recipient's chain:

async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            FungibleOperation::Transfer {
                owner,
                amount,
                target_account,
            } => {
                self.runtime
                    .check_account_permission(owner)
                    .expect("Permission for Transfer operation");
                self.state.debit(owner, amount).await;
                self.finish_transfer_to_account(amount, target_account, owner)
                    .await;
                FungibleResponse::Ok
            }
            // ...
        }
}
    /// Executes the final step of a transfer where the tokens are sent to the destination.
    async fn finish_transfer_to_account(
        &mut self,
        amount: Amount,
        target_account: Account,
        source: AccountOwner,
    ) {
        if target_account.chain_id == self.runtime.chain_id() {
            self.state.credit(target_account.owner, amount).await;
        } else {
            let message = Message::Credit {
                target: target_account.owner,
                amount,
                source,
            };
            self.runtime
                .prepare_message(message)
                .with_authentication()
                .with_tracking()
                .send_to(target_account.chain_id);
        }
    }
On the recipient's chain, execute_message is called, which increases their account balance.

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::Credit {
                amount,
                target,
                source,
            } => {
                let is_bouncing = self
                    .runtime
                    .message_is_bouncing()
                    .expect("Delivery status is available when executing a message");
                let receiver = if is_bouncing { source } else { target };
                self.state.credit(receiver, amount).await;
            }
            // ...
        }
    }
x1.00





Welcome
The Linera Protocol
Overview
Roadmap
Developers
Getting Started
Core Concepts
Writing Backends
Creating a Project
Creating the Application State
Defining the ABI
Writing the Contract Binary
Writing the Service Binary
Deploying the Application
Cross-Chain Messages
Calling other Applications
Using Data Blobs
Printing Logs from an Application
Writing Tests
Writing Frontends
Advanced Topics
Experimental
Node Operators
Devnets
Testnets
Glossary

  
Calling other Applications
We have seen that cross-chain messages sent by an application on one chain are always handled by the same application on the target chain.

This section is about calling other applications using cross-application calls.

Such calls happen on the same chain and are made with the helper method ContractRuntime::call_application:

    pub fn call_application<A: ContractAbi + Send>(
        &mut self,
        authenticated: bool,
        application: ApplicationId<A>,
        call: &A::Operation,
    ) -> A::Response
The authenticated argument specifies whether the callee is allowed to perform actions that require authentication either

on behalf of the signer of the original block that caused this call, or
on behalf of the calling application.
The application argument is the callee's application ID, and A is the callee's ABI.

The call argument is the operation requested by the application call.

Example: crowd-funding
The crowd-funding example application allows the application creator to launch a campaign with a funding target. That target can be an amount specified in any type of token based on the fungible application. Others can then pledge tokens of that type to the campaign, and if the target is not reached by the deadline, they are refunded.

If Alice used the fungible example to create a Pugecoin application (with an impressionable pug as its mascot), then Bob can create a crowd-funding application, use Pugecoin's application ID as CrowdFundingAbi::Parameters, and specify in CrowdFundingAbi::InstantiationArgument that his campaign will run for one week and has a target of 1000 Pugecoins.

Now let's say Carol wants to pledge 10 Pugecoin tokens to Bob's campaign. She can make her pledge by running the linera service and making a query to Bob's application:

mutation { pledge(owner: "User:841…6c0", amount: "10") }
This will add a block to Carol's chain containing the pledge operation that gets handled by CrowdFunding::execute_operation, resulting in one cross-application call and two cross-chain messages:

First CrowdFunding::execute_operation calls the fungible application on Carol's chain to transfer 10 tokens to Carol's account on Bob's chain:

// ...
let call = fungible::Operation::Transfer {
    owner,
    amount,
    target_account,
};
// ...
self.runtime
    .call_application(/* authenticated by owner */ true, fungible_id, &call);
This causes Fungible::execute_operation to be run, which will create a cross-chain message sending the amount 10 to the Pugecoin application instance on Bob's chain.

After the cross-application call returns, CrowdFunding::execute_operation continues to create another cross-chain message crowd_funding::Message::PledgeWithAccount, which informs the crowd-funding application on Bob's chain that the 10 tokens are meant for the campaign.

When Bob now adds a block to his chain that handles the two incoming messages, first Fungible::execute_message gets executed, and then CrowdFunding::execute_message. The latter makes another cross-application call to transfer the 10 tokens from Carol's account to the crowd-funding application's account (both on Bob's chain). That is successful because Carol does now have 10 tokens on this chain and she authenticated the transfer indirectly by signing her block. The crowd-funding application now makes a note in its application state on Bob's chain that Carol has pledged 10 Pugecoin tokens.

References
For the complete code, please take a look at the crowd-funding and the fungible application contracts in the examples folder in linera-protocol.

The implementation of the Runtime made available to contracts is defined in this file.

x1.00




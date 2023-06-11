#!make
include .env

# -------------- DEPLOYMENT -------------- #

deploy: 
	npx hardhat deploy --network $(NETWORK)

deploy-with-tl: 
	npx hardhat deploy-with-tl --use-test-erc20 --verify --network $(NETWORK)

deploy-verify: 
	npx hardhat deploy --verify --network $(NETWORK)

deploy-zk-sync: 
	npx hardhat deploy-zk-sync --network zkSyncTestnet

deploy-mantle: 
	npx hardhat deploy-with-tl --network mantle-testnet

deploy-scroll: 
	npx hardhat deploy-with-tl --verify --network scrollAlpha

deploy-base: 
	npx hardhat deploy-with-tl --verify --network base-goerli

verify:
	npx hardhat verify --network $(NETWORK) <CONTRACT_ADDRESS> "Constructor argument 1" "Constructor argument 2"

#-------------- PLAYGROUND ----------------#

setup-tl:
	npx hardhat run scripts/playground/0-setupTl.ts --network $(NETWORK)

create-hive:
	npx hardhat run scripts/playground/1-createHive.ts --network $(NETWORK)

update-hive-data:
	npx hardhat run scripts/playground/2-updateHiveData.ts --network $(NETWORK)

join-hive:
	npx hardhat run scripts/playground/3-joinHive.ts --network $(NETWORK)

create-proposal-request:
	npx hardhat run scripts/playground/4-createProposalRequest.ts --network $(NETWORK)

execute-proposal-request:
	npx hardhat run scripts/playground/5-executeProposalRequest.ts --network $(NETWORK)

share-funds:
	npx hardhat run scripts/playground/6-shareFunds.ts --network $(NETWORK)

use-paymaster:
	npx hardhat run scripts/usePaymaster.ts --network zkSyncTestnet

#-------------- SETUP ----------------#

setup: deploy-with-tl create-hive update-hive-data join-hive create-proposal-request execute-proposal-request share-funds

#-------------- SUBGRAPH ----------------#

update-subgraph-config: update-subgraph-abis update-subgraph-addresses

ifeq ($(OS),Windows_NT)
update-subgraph-abis:
	Copy "artifacts\contracts\HiveFactory.sol\HiveFactory.json" "$(SUBGRAPH_FOLDER)\abis\HiveFactory.json"
	Copy "artifacts\contracts\Hive.sol\Hive.json" "$(SUBGRAPH_FOLDER)\abis\Hive.json"
else
update-subgraph-abis:
	cp artifacts/contracts/HiveFactory.sol/HiveFactory.json $(SUBGRAPH_FOLDER)/abis/HiveFactory.json
	cp artifacts/contracts/Hive.sol/Hive.json $(SUBGRAPH_FOLDER)/abis/Hive.json
endif

update-subgraph-addresses: 
	npx hardhat run scripts/utils/setSubgraphAddresses.ts --network $(NETWORK)
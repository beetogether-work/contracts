#!make
include .env

# -------------- DEPLOYMENT -------------- #

deploy: 
	npx hardhat deploy --network $(NETWORK)

deploy-verify: 
	npx hardhat deploy --verify --network $(NETWORK)

#-------------- PLAYGROUND ----------------#

setup-tl:
	npx hardhat run scripts/playground/0-setupTl.ts --network $(NETWORK)

create-hive:
	npx hardhat run scripts/playground/1-createHive.ts --network $(NETWORK)

#-------------- SETUP ----------------#

setup: deploy setup-tl create-hive

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
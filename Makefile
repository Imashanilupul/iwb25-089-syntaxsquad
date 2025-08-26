.PHONY: test 


e:
	cd smart-contracts && npx hardhat run --network sepolia scripts/app.js


s:
	cd client && npm run dev

b:
	cd server && bal run


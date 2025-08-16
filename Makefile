.PHONY: test 


e:
	cd smart-contracts && node scripts/app.js


s:
	cd client && npm run dev

b:
	cd server && bal run


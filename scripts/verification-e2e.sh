#!/bin/bash
./scripts/find_replace.sh

# Install E2E test
git clone https://github.com/sourcifyeth/metacoin-source-verify.git
cd metacoin-source-verify
npm ci

# Test WITH providing address and chain
npm run deploy-with-salt:$CHAIN_NAME || exit 3
echo "Waiting 30 secs"
sleep 30 # Leave some buffer for blocks to propogate
echo "Waited 30 secs"

cd ..
node scripts/verification-e2e.js $CHAIN_ID || exit 4

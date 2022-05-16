#!/bin/bash

ipfs init --profile=badgerds
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

## Build announced address config according to https://docs.ipfs.io/how-to/configure-node/#addresses. Need to announce the public and local IPs in swarm manually since docker does not know these IPs.
ANNOUNCED_ADDRESSES='['
if test -n "$PUBLIC_IP"
then 
  ANNOUNCED_ADDRESSES=''$ANNOUNCED_ADDRESSES'"/ip4/'$PUBLIC_IP'/tcp/'$IPFS_LIBP2P_EXTERNAL_PORT'","/ip4/'$PUBLIC_IP'/udp/'$IPFS_LIBP2P_EXTERNAL_PORT'/quic"'
fi 

if test -n "$LOCAL_IP"
then
  if test -n "$PUBLIC_IP" # Add comma if there are addresses in the array already
  then 
    ANNOUNCED_ADDRESSES=$ANNOUNCED_ADDRESSES','
  fi
  ANNOUNCED_ADDRESSES=''$ANNOUNCED_ADDRESSES'"/ip4/'$LOCAL_IP'/tcp/'$IPFS_LIBP2P_EXTERNAL_PORT'","/ip4/'$LOCAL_IP'/udp/'$IPFS_LIBP2P_EXTERNAL_PORT'/quic"'
fi

ANNOUNCED_ADDRESSES=$ANNOUNCED_ADDRESSES']'

ipfs config Addresses.Announce $ANNOUNCED_ADDRESSES --json
ipfs config --json Reprovider.Strategy '"pinned"'
ipfs config --json Experimental.AcceleratedDHTClient true

# Allow WebUI to be accesible from host
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json Addresses.API '["/ip4/0.0.0.0/tcp/5001"]'

source /app/.env

ipfs key import main /app/ipfs-${TAG}.key 

ipfs daemon --enable-pubsub-experiment --enable-namesys-pubsub --enable-gc &

# Add the whole repo and publish on start
date
echo "Starting ipfs add"
hash=$(ipfs add -Q -r /root/.ipfs/repository/contracts)
echo "Finished ipfs add! New ipfs hash: $hash"
date

# cp the repo under MFS
echo "Copying to MFS"
ipfs files cp -p /ipfs/$hash /contracts
echo "Copied to MFS"
date

# Add manifest and stats to MFS.
manifestHash=$(ipfs add -Q /root/.ipfs/repository/manifest.json)
statsHash=$(ipfs add -Q /root/.ipfs/repository/stats.json)
ipfs files cp -p /ipfs/$manifestHash /manifest.json
ipfs files cp -p /ipfs/$statsHash /stats.json

rootHash=$(ipfs files stat / --hash)

echo "Publishing rootHash $rootHash under ipns key"
ipfs -D name publish --key=main $rootHash
echo "Published rootHash $rootHash under ipns key"
date

# Start the run once job.
echo "Docker container has been started"

crontab cron.job
cron -f

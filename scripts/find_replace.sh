#!/bin/bash
set -e

echo $TAG
echo $ACCESS_KEY
echo $SECRET_ACCESS_KEY

search="ACCESS_KEY=xxx"
replace="ACCESS_KEY=$ACCESS_KEY"
sed -i "s/${search}/${replace}/g" .env.$TAG

search="SECRET_ACCESS_KEY=xxx"
replace="SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY"
sed -i "s/${search}/${replace}/g" .env.$TAG

cp .env.$TAG .env

#!/bin/bash

git reset --hard HEAD &&
git pull && 
docker-compose -f docker-compose-prod.yml up --build --force-recreate -d;
#!/bin/bash

# USAGE:
# ./in-docker.sh "npm i && /backend/run-monitoring.sh"
# ./in-docker.sh "npm i && /backend/run-db.sh"
# ./in-docker.sh "/backend/recreate-db.sh"

docker run -v $PWD:/backend --restart=always node $@

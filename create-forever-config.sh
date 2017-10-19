#!/bin/bash

log() {
  tput setaf 1
  echo $1
  tput sgr0
}

dir=`pwd`

cp ${dir}/forever/deploy-service-forever.json.tmpl ${dir}/deploy-service-forever.json
sed -i "s@{SOURCE_DIR}@${dir}@g" deploy-service-forever.json

log "CREATED: ${dir}/deploy-service-forever.json"

#!/bin/sh

docker run \
  -p 8080:8080 \
  -v ~/.config/gcloud/application_default_credentials.json:/usr/app/application_default_credentials.json \
  -e GOOGLE_APPLICATION_CREDENTIALS=/usr/app/application_default_credentials.json \
  -e AWS_ACCESS_KEY_ID=$(aws configure get default.aws_access_key_id) \
  -e AWS_SECRET_ACCESS_KEY=$(aws configure get default.aws_secret_access_key) \
  jats
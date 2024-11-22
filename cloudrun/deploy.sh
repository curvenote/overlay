#!/bin/sh

gcloud run deploy pmc-jats-convert-service \
  --project curvenote-dev-1 \
  --image gcr.io/curvenote-dev-1/pmc-jats-convert-service:$(git rev-parse --short HEAD) \
  --platform managed \
  --ingress internal \
  --memory 4G \
  --concurrency 1 \
  --min-instances 0 \
  --max-instances 10 \
  --region us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars "AWS_ACCESS_KEY_ID=$(aws configure get default.aws_access_key_id)" \
  --set-env-vars "AWS_SECRET_ACCESS_KEY=$(aws configure get default.aws_secret_access_key)"

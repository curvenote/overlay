#!/bin/sh

gcloud builds submit \
  --project curvenote-dev-1 \
  --tag gcr.io/curvenote-dev-1/pmc-jats-convert-service:$(git rev-parse --short HEAD) \
  --timeout 30m \
  .
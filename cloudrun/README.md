# Cloud Run Container for PMC JATS Conversion Service

This contains a Dockerfile with JATS and MyST dependencies and the bundled convert service.

To build:

```
npm run build
```

To deploy:

```
npm run deploy
```

Some other setup stuff is in `pubsub.sh` - but that only needed running once.

To test locally:

```
npm run dev
```

then you can make POST requests to `localhost:8080`. This will borrow your local gcloud application-default credentials, which you may need to generate with

```
gcloud auth application-default login
```

## AWS credentials

AWS credentials are required for accessing the JATS PMC S3 bucket. This access is unrestricted, so for now, it just uses whatever aws credentials are the current default on the machine running deploy.
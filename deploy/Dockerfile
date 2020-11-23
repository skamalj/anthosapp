# Create baseimage to use with gcloud build and main docker build
FROM node:12.19.0-alpine3.12 AS BASE
RUN apk update && apk add curl && apk add python3 && apk add git && apk add openssh-client

# Use base image to build  image with gcloud, kubectl and nomos
FROM BASE AS BASEGCLOUD
USER node
ENV HOME=/home/node
WORKDIR $HOME
RUN curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-318.0.0-linux-x86_64.tar.gz
RUN tar xvf google-cloud-sdk-318.0.0-linux-x86_64.tar.gz
RUN $HOME/google-cloud-sdk/install.sh --quiet --additional-components nomos kubectl

# Use base image to create main application image. 
FROM BASE AS ANTHOSUI
USER node
ENV HOME=/home/node
ENV PATH=$HOME/google-cloud-sdk/bin:$PATH
# Copy binaries from gcloud image. This reduces size from 1.8GB to 500MB
WORKDIR $HOME/google-cloud-sdk/bin
COPY --chown=node:node --from=BASEGCLOUD /home/node/google-cloud-sdk/bin/gcloud  .
COPY --chown=node:node --from=BASEGCLOUD /home/node/google-cloud-sdk/bin/kubectl  .
COPY --chown=node:node --from=BASEGCLOUD /home/node/google-cloud-sdk/bin/nomos  .
WORKDIR $HOME/google-cloud-sdk
COPY --chown=node:node --from=BASEGCLOUD /home/node/google-cloud-sdk/lib  lib/

RUN mkdir $HOME/.ssh

WORKDIR $HOME
COPY --chown=node:node $REPO_NAME/app app/
WORKDIR $HOME/app

# Initializue global git user for git operations
RUN git config --global user.email "phlox@wipro.com"
RUN git config --global user.name "Phlox"

RUN npm install
CMD ["npm", "start"]

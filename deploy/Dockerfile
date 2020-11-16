FROM node:12.19.0-alpine3.12 AS BASE
RUN apk update
RUN apk add curl
RUN apk add python3

FROM BASE AS BASEGCLOUD
USER node
ENV HOME=/home/node
WORKDIR $HOME
RUN ls -l 
RUN curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-318.0.0-linux-x86_64.tar.gz
RUN tar xvf google-cloud-sdk-318.0.0-linux-x86_64.tar.gz
RUN $HOME/google-cloud-sdk/install.sh --quiet --additional-components nomos kubectl

FROM BASE AS ANTHOSUI
USER node
ENV HOME=/home/node
ENV PATH=$HOME/google-cloud-sdk/bin:$PATH

WORKDIR $HOME/google-cloud-sdk/bin
COPY --chown=node:node --from=BASEGCLOUD /home/node/google-cloud-sdk/bin/gcloud  .
COPY --chown=node:node --from=BASEGCLOUD /home/node/google-cloud-sdk/bin/kubectl  .
COPY --chown=node:node --from=BASEGCLOUD /home/node/google-cloud-sdk/bin/nomos  .
WORKDIR $HOME/google-cloud-sdk
COPY --chown=node:node --from=BASEGCLOUD /home/node/google-cloud-sdk/lib  lib/

RUN mkdir $HOME/.ssh
ENV SSH_CONFIG_FILE /home/node/.ssh/config

RUN mkdir -p $HOME/anthos
WORKDIR $HOME/anthos
COPY --chown=node:node . .
RUN ls -l .
RUN npm install
CMD ["npm", "start"]

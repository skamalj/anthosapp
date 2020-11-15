FROM node:12.19.0-alpine3.12
RUN apk upgrade
RUN apk add curl
RUN apk add python3

USER node
WORKDIR $HOME
RUN curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-318.0.0-linux-x86_64.tar.gz
RUN tar xvf google-cloud-sdk-318.0.0-linux-x86_64.tar.gz
RUN $HOME/google-cloud-sdk/install.sh --quiet --additional-components nomos kubectl
RUN export PATH=$HOME/google-cloud-sdk/bin:$PATH

RUN mkdir anthos
COPY . /anthos/
WORKDIR $HOME/anthos
RUN npm install
CMD ["npm", "start"]
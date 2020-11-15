FROM node:12.19.0-alpine3.12
RUN apk upgrade
RUN apk add curl && apk add python3 && apk add git && apk add openssh-client

USER node
WORKDIR $HOME
RUN mkdir .ssh
RUN curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-318.0.0-linux-x86_64.tar.gz
RUN tar xvf google-cloud-sdk-318.0.0-linux-x86_64.tar.gz
RUN $HOME/google-cloud-sdk/install.sh --quiet --additional-components nomos kubectl
ENV PATH=$HOME/google-cloud-sdk/bin:$PATH

RUN echo $PATH

RUN mkdir anthos
COPY . /anthos/
WORKDIR $HOME/anthos
RUN npm install
CMD ["npm", "start"]
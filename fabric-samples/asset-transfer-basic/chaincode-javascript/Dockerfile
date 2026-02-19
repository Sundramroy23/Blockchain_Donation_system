FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy chaincode source
COPY . .

# The chaincode server port
ARG CC_SERVER_PORT=9999
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:${CC_SERVER_PORT}
ENV CHAINCODE_CCID_FILE=/usr/src/app/ccid
ENV CC_SERVER_PORT=${CC_SERVER_PORT}

# Start the chaincode in server mode
CMD node /usr/src/app/node_modules/.bin/fabric-chaincode-node server --chaincode-address=$CHAINCODE_SERVER_ADDRESS --chaincode-id=$CHAINCODE_ID

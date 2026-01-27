FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy chaincode source
COPY . .

# The chaincode server port
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999
ARG CC_SERVER_PORT
ENV CC_SERVER_PORT=${CC_SERVER_PORT}

# Start the chaincode
CMD ["node", "index.js", "--peer.address", "${CHAINCODE_SERVER_ADDRESS}"]

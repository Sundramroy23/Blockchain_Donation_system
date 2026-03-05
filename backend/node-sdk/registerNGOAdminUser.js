
'use strict';

const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..','fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org3.example.com', 'connection-org3.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.org3.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get('ngoAdminUser');
        if (userIdentity) {
            console.log('An identity for the user "ngoAdminUser" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the ngoAdmin user.
        const adminIdentity = await wallet.get('ngoAdmin');
        if (!adminIdentity) {
            console.log('An identity for the ngoAdmin user "ngoAdmin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'ngoAdmin');

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: 'org3.department1',
            enrollmentID: 'ngoAdminUser',
            role: 'client',
            attrs: [{ name: 'role', value: 'ngoAdmin', ecert: true },{ name: 'userId', value: 'ngoAdminUser', ecert: true }],
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: 'ngoAdminUser',
            enrollmentSecret: secret,
            attr_reqs: [{ name: "role", optional: false },{ name: "userId", optional: false }]
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org3MSP',
            type: 'X.509',
        };
        await wallet.put('ngoAdminUser', x509Identity);
        console.log('Successfully registered and enrolled ngoAdmin user "ngoAdminUser" and imported it into the wallet');

                // // -----------------------Create Wallet with default balance on ledger------------------ 
                // // Create a new gateway for connecting to our peer node.
                // const gateway = new Gateway();
                // await gateway.connect(ccp, { wallet, identity: 'ngoAdminUser', discovery: { enabled: true, asLocalhost: true } });
        
                // // Get the network (channel) our contract is deployed to.
                // const network = await gateway.getNetwork('mychannel');
        
                // // Get the contract from the network.
                // const contract = network.getContract('ccc01','UserContract');
        
                // const res = await contract.submitTransaction('RegisterDonor',"sita01", 'SitaRam', 'ramSita@gmail.com', 'Hair');
                // console.log("Token name ::", res.toString());
        
                // const result2 = await contract.evaluateTransaction('GetAllDonors');
                // console.log('Mint status :: ', result2.toString());
        
            
               
                // // Disconnect from the gateway.
                // await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to register user "ngoAdminUser": ${error}`);
        process.exit(1);
      }
}

main();
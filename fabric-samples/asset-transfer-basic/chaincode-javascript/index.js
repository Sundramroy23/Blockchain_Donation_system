/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// 'use strict';

// const assetTransfer = require('./lib/assetTransfer');

// module.exports.AssetTransfer = assetTransfer;
// module.exports.contracts = [assetTransfer];

// using ES script

// import UserContract from './contracts/userContracts.js'
// import FundContract from './contracts/fundContract.js'
// import TokenContract from './contracts/tokenContract.js'

// export { UserContract, FundContract, TokenContract}

// export const contracts = [
//     UserContract,
//     FundContract,
//     TokenContract,
// ];


// using commonjs

'use strict';

const UserContract = require('./contracts/userContract');
const FundContract = require('./contracts/fundContract');
const TokenContract = require('./contracts/tokenContract');

module.exports.UserContract = UserContract;
module.exports.FundContract = FundContract;
module.exports.TokenContract = TokenContract;

module.exports.contracts = [
    UserContract,
    FundContract,
    TokenContract,
];
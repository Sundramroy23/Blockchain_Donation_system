'use strict';
const { Contract } = require('fabric-contract-api');
const { getTimestamp, requireMSP } = require('./utils');


class TokenContract extends Contract {
    constructor() {
        super('TokenContract');
    }

    async _collectQueryResults(iterator) {
        const allResults = [];

        if (iterator && typeof iterator[Symbol.asyncIterator] === 'function') {
            for await (const res of iterator) {
                const strValue = res.value.toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    record = strValue;
                }
                allResults.push(record);
            }
            return allResults;
        }

        let result = await iterator.next();
        while (!result.done) {
            const strValue = result.value.value.toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        await iterator.close();
        return allResults;
    }

     // ===== Issue tokens (only Org2MSP) ===
    // == ownerId can be Donor id or FundManager id===== initialy assigned to donorId
    async IssueToken(ctx, bankId, ownerId, amount) {
        requireMSP(ctx, ['Org2MSP'], "bankUser");
        const parsedAmount = parseFloat(amount);
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error(`Invalid token amount: ${amount}`);
        }
        const txId = ctx.stub.getTxID();
        const tokenKey = `TOKEN_${bankId}_${ownerId}_${txId}`;
        
        const token = {
            tokenId: tokenKey,
            bankId,
            ownerId,
            amount: parsedAmount,
            totalAmount: parsedAmount,
            remainingAmount: parsedAmount,
            spentAmount: 0,
            status: 'ISSUED',
            issuedAt: getTimestamp(ctx),
            creatorMSP: ctx.clientIdentity.getMSPID(),
            type: 'TOKEN',
        };

        await ctx.stub.putState(tokenKey, Buffer.from(JSON.stringify(token)));
        return JSON.stringify(token);
    }

     // ===== Transfer tokens (Donor -> FundManager) using bank toId is ngo fund manager id=====
    async TransferToken(ctx, tokenId, toId) {
        requireMSP(ctx, ['Org2MSP'], "bankUser");
        const tokenBytes = await ctx.stub.getState(tokenId);
        if (!tokenBytes || tokenBytes.length === 0) {
            throw new Error(`Token ${tokenId} not found`);
        }

        const token = JSON.parse(tokenBytes.toString());
        if (typeof token.totalAmount !== 'number' || typeof token.spentAmount !== 'number' || typeof token.remainingAmount !== 'number') {
            throw new Error(`Token ${tokenId} has invalid accounting fields`);
        }

        if (token.status !== 'ISSUED') {
            throw new Error(`Token ${tokenId} cannot be transferred in status ${token.status}`);
        }

        if (token.remainingAmount <= 0) {
            throw new Error(`Token ${tokenId} has no remaining balance`);
        }

        token.toId = toId;
        token.currentHolderId = toId;
        token.status = 'TRANSFERRED';
        token.transferredAt = getTimestamp(ctx);

        await ctx.stub.putState(tokenId, Buffer.from(JSON.stringify(token)));
        return JSON.stringify(token);
    }

   // ===== Redeem token (only NGO) =====
    async RedeemToken(ctx, tokenId, ngoId) {
        requireMSP(ctx, ['Org3MSP'], "ngoUser");
        const tokenBytes = await ctx.stub.getState(tokenId);
        if (!tokenBytes || tokenBytes.length === 0) {
            throw new Error(`Token ${tokenId} not found`);
        }

        const token = JSON.parse(tokenBytes.toString());
        token.redeemedBy = ngoId;
        token.status = 'REDEEMED';
        token.redeemedAt = getTimestamp(ctx);

        await ctx.stub.putState(tokenId, Buffer.from(JSON.stringify(token)));
        return JSON.stringify(token);
    }
 
      // get all tokens by bank id
    async GetTokensByBank(ctx, bankId) {
        const queryString = {
            selector: {
                bankId: bankId,
                type: 'TOKEN',
            },
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const allResults = await this._collectQueryResults(iterator);
        return JSON.stringify(allResults);
    }

    // get current (unspent) tokens by owner/donor id
    async GetTokensByOwner(ctx, ownerId) {
        const queryString = {
            selector: {
                ownerId: ownerId,
                type: 'TOKEN',
            },
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const queried = await this._collectQueryResults(iterator);
        const allResults = [];
        for (const record of queried) {
            if (!(record && typeof record === 'object')) {
                continue;
            }
            const remainingAmount = Number(record.remainingAmount ?? 0);
            const status = String(record.status || '');
            if (remainingAmount > 0 && status !== 'REDEEMED' && status !== 'DONATED') {
                allResults.push(record);
            }
        }
        return JSON.stringify(allResults);
    }

}

module.exports = TokenContract;
import { Contract } from 'fabric-contract-api';
import { getTimestamp, requireMSP } from './utilsFixed.js';


class TokenContractFixed extends Contract {
    constructor() {
        super('TokenContractFixed');
    }

    // ===== Issue tokens (only Org2MSP/bank_user) ===
    async IssueToken(ctx, bankId, ownerId, amount) {
        requireMSP(ctx, ['Org2MSP'], 'bank_user');
        const txId = ctx.stub.getTxID();
        const tokenKey = `TOKEN_${bankId}_${ownerId}_${txId}`;
        
        const token = {
            tokenId: tokenKey,
            bankId,
            ownerId,
            amount: parseFloat(amount),
            status: 'ISSUED',
            issuedAt: getTimestamp(ctx),
            creatorMSP: ctx.clientIdentity.getMSPID(),
            type: 'TOKEN',
        };

        await ctx.stub.putState(tokenKey, Buffer.from(JSON.stringify(token)));
        return JSON.stringify(token);
    }

    // ===== Transfer tokens (Donor -> FundManager) using bank toId is ngo fund manager id =====
    async TransferToken(ctx, tokenId, toId) {
        requireMSP(ctx, ['Org2MSP'], 'bank_user');
        const tokenBytes = await ctx.stub.getState(tokenId);
        if (!tokenBytes || tokenBytes.length === 0) {
            throw new Error(`Token ${tokenId} not found`);
        }

        const token = JSON.parse(tokenBytes.toString());
        token.toId = toId;
        token.status = 'TRANSFERRED';
        token.transferredAt = getTimestamp(ctx);

        await ctx.stub.putState(tokenId, Buffer.from(JSON.stringify(token)));
        return JSON.stringify(token);
    }

   // ===== Redeem token (only NGO) =====
    async RedeemToken(ctx, tokenId, ngoId) {
        requireMSP(ctx, ['Org3MSP'], 'ngo_user');
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
        const allResults = [];
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
        return JSON.stringify(allResults);
    }

    // helper: get token by id
    async GetToken(ctx, tokenId) {
        const tokenBytes = await ctx.stub.getState(tokenId);
        if (!tokenBytes || tokenBytes.length === 0) {
            throw new Error(`Token ${tokenId} not found`);
        }
        return tokenBytes.toString();
    }

}

export default TokenContractFixed;

import { Contract } from 'fabric-contract-api';
import { getTimestamp, requireMSP } from './utilsFixed.js';


class FundContractFixed extends Contract {
    constructor() {
        super('FundContractFixed');
    }

    // ===== Fund creation (only NGO org) =====
    async CreateFund(ctx, fundId, ngoId, title, purpose, fundTarget) {
        // standardized role: 'ngo_user' for NGO operators
        requireMSP(ctx, ['Org3MSP'], 'ngo_user');
        const fundKey = `FUND_${fundId}`;

        if (await ctx.stub.getState(fundKey)) {
            throw new Error(`Fund ${fundId} already exists`);
        }

        const fund = {
            fundId,
            ngoId,
            title,
            purpose,
            fundTarget: parseFloat(fundTarget),
            totalTokens: 0,
            donations: [],
            expenses: [],
            createdAt: getTimestamp(ctx),
            status: 'ACTIVE',
            type: 'FUND'
        };

        await ctx.stub.putState(fundKey, Buffer.from(JSON.stringify(fund)));
        return JSON.stringify(fund);
    }

    // ===== Donation (Bank submits donation transaction after transfer) =====
    // flow: IssueToken (Org2MSP/bank_user) -> TransferToken (Org2MSP/bank_user) -> Donate (Org2MSP/bank_user)
    async Donate(ctx, fundId, donorId, tokenId, amount, cid) {
        // enforce that only bank users (Org2MSP) can invoke Donate per the described flow
        requireMSP(ctx, ['Org2MSP'], 'bank_user');

        const fundKey = `FUND_${fundId}`;
        const fundBytes = await ctx.stub.getState(fundKey);
        if (!fundBytes || fundBytes.length === 0) {
            throw new Error(`Fund ${fundId} not found`);
        }

        // validate token state
        const tokenBytes = await ctx.stub.getState(tokenId);
        if (!tokenBytes || tokenBytes.length === 0) {
            throw new Error(`Token ${tokenId} not found`);
        }
        let token;
        try {
            token = JSON.parse(tokenBytes.toString());
        } catch (err) {
            throw new Error(`Token ${tokenId} has invalid JSON`);
        }

        // token must have been transferred and not already redeemed
        if (token.status !== 'TRANSFERRED') {
            throw new Error(`Token ${tokenId} is not in TRANSFERRED state`);
        }
        if (token.status === 'REDEEMED') {
            throw new Error(`Token ${tokenId} is already redeemed`);
        }

        // validate amount
        const amt = Number(amount);
        if (isNaN(amt) || amt <= 0) {
            throw new Error(`Invalid donation amount: ${amount}`);
        }

        const fund = JSON.parse(fundBytes.toString());
        const donation = {
            donorId,
            tokenId,
            cid,
            amount: amt,
            timestamp: getTimestamp(ctx)
        };

        fund.totalTokens = Number(fund.totalTokens) + amt;
        fund.donations.push(donation);

        await ctx.stub.putState(fundKey, Buffer.from(JSON.stringify(fund)));
        return JSON.stringify(fund);
    }

    // ===== Add Expense (only NGO org) ===== (spenderId == vendorId)
    async AddExpense(ctx, fundId, description, amount, spenderId) {
        requireMSP(ctx, ['Org3MSP'], 'ngo_user');
        const fundKey = `FUND_${fundId}`;
        const fundBytes = await ctx.stub.getState(fundKey);
        if (!fundBytes || fundBytes.length === 0) {
            throw new Error(`Fund ${fundId} not found`);
        }

        const fund = JSON.parse(fundBytes.toString());
        const amt = Number(amount);
        if (isNaN(amt) || amt <= 0) {
            throw new Error(`Invalid expense amount: ${amount}`);
        }

        const expense = {
            description,
            amount: amt,
            spenderId,
            timestamp: getTimestamp(ctx)
        };

        fund.expenses.push(expense);
        fund.totalTokens = Number(fund.totalTokens) - amt;
        if (fund.totalTokens < 0) {
            throw new Error('Insufficient fund balance: totalTokens would become negative');
        }

        await ctx.stub.putState(fundKey, Buffer.from(JSON.stringify(fund)));
        return JSON.stringify(fund);
    }

    async GetFund(ctx, fundId) {
        const fundBytes = await ctx.stub.getState(`FUND_${fundId}`);
        if (!fundBytes || fundBytes.length === 0) {
            throw new Error(`Fund ${fundId} not found`);
        }
        return fundBytes.toString();
    }

    async CloseFund(ctx, fundId) {
        // only NGO users should close funds
        requireMSP(ctx, ['Org3MSP'], 'ngo_user');

        const fundKey = `FUND_${fundId}`;
        const fundBytes = await ctx.stub.getState(fundKey);
        if (!fundBytes || fundBytes.length === 0) {
            throw new Error(`Fund ${fundId} not found`);
        }

        const fund = JSON.parse(fundBytes.toString());
        fund.status = 'CLOSED';
        fund.closedAt = getTimestamp(ctx);

        await ctx.stub.putState(fundKey, Buffer.from(JSON.stringify(fund)));
        return JSON.stringify(fund);
    }

    async GetAllFundsByNGO(ctx, ngoId) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = result.value.value.toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.ngoId === ngoId) { // simple check to identify fund records
                allResults.push(record);
            }
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }

    async GetAllFunds(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = result.value.value.toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.type === 'FUND') { // simple check to identify fund records
                allResults.push(record);
            }
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }

    async GetAllDonationsByDonor(ctx, donorId) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = result.value.value.toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.type === 'FUND') { // simple check to identify fund records
                const donations = record.donations.filter(d => d.donorId === donorId);
                if (donations.length > 0) {
                    allResults.push({
                        fundId: record.fundId,
                        ngoId: record.ngoId,
                        title: record.title,
                        donations: donations
                    });
                }
            }
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
        
    }
}


export default FundContractFixed;

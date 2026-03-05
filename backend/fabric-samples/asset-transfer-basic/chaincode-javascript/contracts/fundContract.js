'use strict';
const { Contract } = require('fabric-contract-api');
const { assetExists, getTimestamp, requireMSP } = require('./utils');


class FundContract extends Contract {
    constructor() {
        super('FundContract');
    }

      // ===== Fund creation (only NGO org) =====
    async CreateFund(ctx, fundId, ngoId, title, purpose, fundTarget) {
        requireMSP(ctx, ['Org3MSP'], "ngoUser");
        const fundKey = `FUND_${fundId}`;

        console.log(`Checking existence for fund ID: ${fundId}`);

        if (await assetExists(ctx, fundKey)) {
            throw new Error(`Fund ${fundId} already exists`);
        }

        const fund = {
            fundId,
            ngoId,
            title,
            purpose,
            fundTarget,
            totalTokens: 0,
            donations: [],
            expenses: [],
            createdAt: getTimestamp(ctx),
            status: 'ACTIVE',
            type: 'FUND'
        };

        console.log(`Creating fund ${JSON.stringify(fund)}`);

        await ctx.stub.putState(fundKey, Buffer.from(JSON.stringify(fund)));
        return JSON.stringify(fund);
    }

     // ===== Donation (only Donor org) ===== before donating, donor must need to call the IssueToken and TransferToken functions from TokenContract
    // steps to donate: click on Donate button -> call IssueToken (Org2MSP) -> call TransferToken (Org2MSP) -> call Donate (Org2MSP)
    async Donate(ctx, fundId, donorId, tokenId, amount, cid) {
        // SUGGESTED_TOGGLE: restrict who can invoke Donate by uncommenting an appropriate requireMSP.
        // Example: if donations are submitted by the Bank (Org2MSP) as per flow, uncomment:
        // requireMSP(ctx, ['Org2MSP'], 'bankUser');
        // Or, if donors call Donate directly, uncomment the line below and replace 'DonorMSP' with the correct MSP and role:
        // requireMSP(ctx, ['DonorMSP'], 'donorUser');
        const fundKey = `FUND_${fundId}`;
        const fundBytes = await ctx.stub.getState(fundKey);
        if (!fundBytes || fundBytes.length === 0) {
            throw new Error(`Fund ${fundId} not found`);
        }

        const fund = JSON.parse(fundBytes.toString());
        const tokenBytes = await ctx.stub.getState(tokenId);
        if (!tokenBytes || tokenBytes.length === 0) {
            throw new Error(`Token ${tokenId} not found`);
        }

        const token = JSON.parse(tokenBytes.toString());
        const donationAmount = parseFloat(amount);
        if (Number.isNaN(donationAmount) || donationAmount <= 0) {
            throw new Error(`Invalid donation amount: ${amount}`);
        }

        if (typeof token.totalAmount !== 'number' || typeof token.spentAmount !== 'number' || typeof token.remainingAmount !== 'number') {
            throw new Error(`Token ${tokenId} has invalid accounting fields`);
        }

        if (token.ownerId !== donorId) {
            throw new Error(`Token ${tokenId} does not belong to donor ${donorId}`);
        }

        if (token.toId !== fund.ngoId) {
            throw new Error(`Token ${tokenId} is not transferred to NGO ${fund.ngoId}`);
        }

        if (!['TRANSFERRED', 'PARTIALLY_DONATED'].includes(token.status)) {
            throw new Error(`Token ${tokenId} cannot be donated in status ${token.status}`);
        }

        if (donationAmount > token.remainingAmount) {
            throw new Error(`Insufficient token balance. Available: ${token.remainingAmount}, requested: ${donationAmount}`);
        }

        const donationTimestamp = getTimestamp(ctx);
        const donation = {
            donorId,
            tokenId,
            cid,
            amount: donationAmount,
            timestamp: donationTimestamp
        };

        token.spentAmount += donationAmount;
        token.remainingAmount -= donationAmount;
        token.status = token.remainingAmount === 0 ? 'DONATED' : 'PARTIALLY_DONATED';
        token.lastDonatedAt = donationTimestamp;

        fund.totalTokens = Number(fund.totalTokens || 0) + donationAmount;
        fund.donations.push(donation);

        await ctx.stub.putState(tokenId, Buffer.from(JSON.stringify(token)));
        await ctx.stub.putState(fundKey, Buffer.from(JSON.stringify(fund)));
        return JSON.stringify(fund);
    }

       // ===== Add Expense (only NGO org) ===== (spenderId == vendorId)
    async AddExpense(ctx, fundId, description, amount, spenderId) {
        requireMSP(ctx, ['Org3MSP'], "ngoUser");
        const fundKey = `FUND_${fundId}`;
        const fundBytes = await ctx.stub.getState(fundKey);
        if (!fundBytes || fundBytes.length === 0) {
            throw new Error(`Fund ${fundId} not found`);
        }

        const fund = JSON.parse(fundBytes.toString());
        const parsedAmount = parseFloat(amount);
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error(`Invalid expense amount: ${amount}`);
        }

        if (Number(fund.totalTokens || 0) < parsedAmount) {
            throw new Error(`Insufficient fund balance. Available: ${fund.totalTokens || 0}, requested: ${parsedAmount}`);
        }

        const expense = {
            description,
            amount: parsedAmount,
            spenderId,
            timestamp: getTimestamp(ctx)
        };

        fund.expenses.push(expense);
        fund.totalTokens = Number(fund.totalTokens || 0) - parsedAmount;

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
        // NOTE: current call allows multiple MSPs but enforces a single role 'ngoUser'.
        // SUGGESTED_TOGGLE: choose one of the options below and uncomment accordingly.
        // If only NGO should close funds (recommended):
        // requireMSP(ctx, ['Org3MSP'], 'ngoUser');
        // If both Org3 and Org2 should be allowed with different roles, implement explicit checks, e.g.:
        /*
        const msp = ctx.clientIdentity.getMSPID();
        const role = ctx.clientIdentity.getAttributeValue('role');
        if (!((msp === 'Org3MSP' && role === 'ngoUser') || (msp === 'Org2MSP' && role === 'bankUser'))) {
            throw new Error('Access denied: not permitted to close fund');
        }
        */
        requireMSP(ctx, ['Org3MSP', 'Org2MSP'], "ngoUser");
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


module.exports = FundContract;
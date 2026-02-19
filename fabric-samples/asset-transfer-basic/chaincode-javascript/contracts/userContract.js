'use strict';
// SUGGESTED_TOGGLE: Standardize role attribute names across contracts and identities.
// Example canonical names: 'ngo_admin', 'ngo_user', 'gov_user', 'bank_user'.
// Replace occurrences like "ngoAdmin" with "ngo_admin" and update CA identity attributes accordingly.
const { Contract } = require('fabric-contract-api');
const { assetExists, getTimestamp, requireMSP, getAllUsersByType } = require('./utils');


class UserContract extends Contract {
    constructor() {
        super('UserContract');
    } 

     // ===== NGO Registration (only Government Org) =====
    async RegisterNGO(ctx, ngoId, name, regNo, address, contact, description, cid) {
        requireMSP(ctx, ['Org3MSP'], "ngoAdmin");
        const ngoKey = `NGO_${ngoId}`;
        if (await assetExists(ctx, ngoKey)) {
            throw new Error(`NGO ${ngoId} already exists`);
        }
       

        const ngo = {
            ngoId,
            name,
            regNo,
            address,
            contact,
            description,
            cid,
            creatorMSP: ctx.clientIdentity.getMSPID(),
            creator: ctx.clientIdentity.getID(),
            createdAt: getTimestamp(ctx),
            type: 'NGO'
        };

        await ctx.stub.putState(ngoKey, Buffer.from(JSON.stringify(ngo)));
        return JSON.stringify(ngo);
    }

     async GetNGO(ctx, ngoId) {
        const ngoBytes = await ctx.stub.getState(`NGO_${ngoId}`);
        if (!ngoBytes || ngoBytes.length === 0) {
            throw new Error(`NGO ${ngoId} not found`);
        }
        return ngoBytes.toString();
    }

    // ===== Donor Registration (any user can register) =====
    async RegisterDonor(ctx, donorId, name, email, alias, cid) {
        const donorKey = `DONOR_${donorId}`;
        if (await assetExists(ctx, donorKey)) {
            throw new Error(`Donor ${donorId} already exists`);
        }

        const donor = {
            donorId,
            name,
            email,
            alias,
            cid,
            creatorMSP: ctx.clientIdentity.getMSPID(),
            creator: ctx.clientIdentity.getID(),
            createdAt: getTimestamp(ctx),
            type: 'DONOR'
        };

        await ctx.stub.putState(donorKey, Buffer.from(JSON.stringify(donor)));
        return JSON.stringify(donor);
    }

    async GetDonor(ctx, donorId) {
        const donorBytes = await ctx.stub.getState(`DONOR_${donorId}`);
        if (!donorBytes || donorBytes.length === 0) {
            throw new Error(`Donor ${donorId} not found`);
        }
        return donorBytes.toString();
    }

     // ===== Bank Registration (only Org2MSP can onboard Banks) =====
    async RegisterBank(ctx, bankId, name, branch, ifscCode, cid) {
        requireMSP(ctx, ['Org2MSP'], "govUser");
        const bankKey = `BANK_${bankId}`;
        if (await assetExists(ctx, bankKey)) {
            throw new Error(`Bank ${bankId} already exists`);
        }

        const bank = {
            bankId,
            name,
            branch,
            ifscCode,
            cid,
            creatorMSP: ctx.clientIdentity.getMSPID(),
            creator: ctx.clientIdentity.getID(),
            createdAt: getTimestamp(ctx),
            type: 'BANK'
        };

        await ctx.stub.putState(bankKey, Buffer.from(JSON.stringify(bank)));
        return JSON.stringify(bank);
    }

    async GetBank(ctx, bankId) {
        const bankBytes = await ctx.stub.getState(`BANK_${bankId}`);
        if (!bankBytes || bankBytes.length === 0) {
            throw new Error(`Bank ${bankId} not found`);
        }
        return bankBytes.toString();
    }

    async GetAllBanks(ctx) {
        requireMSP(ctx, ['Org2MSP'], "govUser");
        const banks = await getAllUsersByType(ctx, 'BANK');
        return JSON.stringify(banks);
    }

    async GetAllNGOs(ctx) {
        requireMSP(ctx, ['Org2MSP'], "govUser");
        const ngos = await getAllUsersByType(ctx, 'NGO');
        return JSON.stringify(ngos);
    }

    async GetAllDonors(ctx) {
        requireMSP(ctx, ['Org2MSP'], "govUser");
        const donors = await getAllUsersByType(ctx, 'DONOR');
        return JSON.stringify(donors);
    }

}

module.exports = UserContract;
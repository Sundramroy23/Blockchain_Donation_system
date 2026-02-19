export async function assetExists(ctx, id) {
    const data = await ctx.stub.getState(id);
    console.log(`Asset existence check for ID ${id}: ${data && data.length > 0}`);
    return data && data.length > 0;
}

// Safer getTimestamp implementation that handles protobuf Longs
export function getTimestamp(ctx) {
    const timestamp = ctx.stub.getTxTimestamp();
    const secondsRaw = timestamp.seconds;
    const seconds = (secondsRaw && typeof secondsRaw.toNumber === 'function')
        ? secondsRaw.toNumber()
        : Number(secondsRaw || 0);
    const nanos = timestamp.nanos || 0;
    const milliseconds = seconds * 1000 + Math.floor(nanos / 1e6);
    const date = new Date(milliseconds);
    return date.toISOString();
}

// Role-based access check (by MSP)
// Keeps the same signature: requireMSP(ctx, allowedMSPs, role)
// Adds a clearer error for missing role attribute
export function requireMSP(ctx, allowedMSPs, role) {
    const mspId = ctx.clientIdentity.getMSPID();
    const userRole = ctx.clientIdentity.getAttributeValue('role');

    if (!allowedMSPs.includes(mspId)) {
        throw new Error(`Access denied for MSP: ${mspId}. Allowed: ${allowedMSPs.join(', ')}`);
    }

    if (!userRole) {
        throw new Error(`Access denied: identity is missing 'role' attribute. Required: ${role}`);
    }

    if (userRole !== role) {
        throw new Error(`Access denied for role: ${userRole}. Required: ${role}`);
    }
}

// get all users based on type
export async function getAllUsersByType(ctx, userType) {
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
        if (record.type === userType) {
            allResults.push(record);
        }
        result = await iterator.next();
    }
    await iterator.close();
    return allResults;
}

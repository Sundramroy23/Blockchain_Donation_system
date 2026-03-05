async function assetExists(ctx, id) {
    const data = await ctx.stub.getState(id);
    console.log(`Asset existence check for ID ${id}: ${data && data.length > 0}`);
    return data && data.length > 0;
}


// export function getTimestamp(ctx) {
//     const timestamp = ctx.stub.getTxTimestamp();
//     const milliseconds = timestamp.seconds * 1000 + timestamp.nanos / 1e6;
//     const date = new Date(milliseconds);
//     return date.toISOString();
// }

function getTimestamp(ctx) {
  const ts = ctx.stub.getTxTimestamp();
  const seconds = (ts.seconds && typeof ts.seconds.toNumber === 'function') ? ts.seconds.toNumber() : Number(ts.seconds || 0);
  const millis = seconds * 1000 + Math.floor((ts.nanos || 0) / 1e6);
  const date = new Date(millis);

  // Build ISO-like string in Asia/Kolkata
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const m = {};
  parts.forEach(p => m[p.type] = p.value);
  // resulting string: YYYY-MM-DDTHH:mm:ss+05:30
  return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}:${m.second}+05:30`;
}

// SUGGESTED_TOGGLE: safer getTimestamp implementation for protobuf Long seconds
/*
export function getTimestamp(ctx) {
    const timestamp = ctx.stub.getTxTimestamp();
    const seconds = (timestamp.seconds && typeof timestamp.seconds.toNumber === 'function')
        ? timestamp.seconds.toNumber()
        : Number(timestamp.seconds);
    const nanos = timestamp.nanos || 0;
    const milliseconds = seconds * 1000 + Math.floor(nanos / 1e6);
    const date = new Date(milliseconds);
    return date.toISOString();
}
*/

// Role-based access check (by MSP)
function requireMSP(ctx, allowedMSPs, role) {
    const mspId = ctx.clientIdentity.getMSPID();
    const userRole = ctx.clientIdentity.getAttributeValue('role');

    if (!allowedMSPs.includes(mspId)) {
        throw new Error(`Access denied for MSP: ${mspId}. Allowed: ${allowedMSPs.join(', ')}`);
    }

    if (userRole !== role) {
        throw new Error(`Access denied for role: ${userRole}. Required: ${role}`);
    }
}

// SUGGESTED_TOGGLE: clearer requireMSP variant (uncomment to use)
/*
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
*/


// get all users based on type
async function getAllUsersByType(ctx, userType) {
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

module.exports = { assetExists, getTimestamp, requireMSP, getAllUsersByType };
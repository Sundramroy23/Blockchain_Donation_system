const API_DEFINITIONS = {
  Users: [
    { name: 'Register Donor', method: 'POST', path: '/api/users/donor', fields: ['userCert', 'donorId', 'name', 'email', 'alias'] },
    { name: 'Get Donor', method: 'GET', path: '/api/users/donor', fields: ['userCert', 'donorId'] },
    { name: 'Register NGO', method: 'POST', path: '/api/users/ngo', fields: ['userCert', 'ngoId', 'name', 'regNo', 'address', 'contact', 'description'] },
    { name: 'Get NGO', method: 'GET', path: '/api/users/ngo', fields: ['userCert', 'ngoId'] },
    { name: 'Register Bank', method: 'POST', path: '/api/users/bank', fields: ['userCert', 'bankId', 'name', 'branch', 'ifscCode'] },
    { name: 'Get Bank', method: 'GET', path: '/api/users/bank', fields: ['userCert', 'bankId'] },
    { name: 'Get All Banks', method: 'GET', path: '/api/users/allBank', fields: ['userCert'] },
    { name: 'Get All Donors', method: 'GET', path: '/api/users/allDonor', fields: ['userCert'] },
    { name: 'Get All NGOs', method: 'GET', path: '/api/users/allNGO', fields: ['userCert'] },
    { name: 'Register Gov User', method: 'POST', path: '/api/users/gov-user', fields: ['userCert', 'govUserId', 'name', 'email', 'designation'] },
    { name: 'Get All Gov Users', method: 'GET', path: '/api/users/gov-user', fields: ['userCert'] }
  ],
  Funds: [
    { name: 'Create Fund', method: 'POST', path: '/api/funds', fields: ['userCert', 'fundId', 'ngoId', 'title', 'purpose', 'fundTarget'] },
    { name: 'Get All Funds', method: 'GET', path: '/api/funds', fields: ['userCert'] },
    { name: 'Get Fund', method: 'GET', path: '/api/funds/:fundId', fields: ['userCert', 'fundId'] },
    { name: 'Donate', method: 'POST', path: '/api/funds/:fundId/donate', fields: ['userCert', 'fundId', 'donorId', 'tokenId', 'amount'] },
    { name: 'Donate (One Shot)', method: 'POST', path: '/api/funds/:fundId/donate-one-shot', fields: ['userCert', 'donorUserCert', 'fundId', 'bankId', 'donorId', 'amount'] },
    { name: 'Add Expense', method: 'POST', path: '/api/funds/:fundId/expense', fields: ['userCert', 'fundId', 'description', 'amount', 'spenderId'] },
    { name: 'Close Fund', method: 'GET', path: '/api/funds/:fundId/close', fields: ['userCert', 'fundId'] },
    { name: 'Get Funds By NGO', method: 'GET', path: '/api/funds/ngo/:ngoId/funds', fields: ['userCert', 'ngoId'] },
    { name: 'Get Donations By Donor', method: 'GET', path: '/api/funds/donor/:donorId/donations', fields: ['userCert', 'donorId'] }
  ],
  Tokens: [
    { name: 'Issue Token', method: 'POST', path: '/api/tokens/issue', fields: ['userCert', 'bankId', 'ownerId', 'amount'] },
    { name: 'Transfer Token', method: 'POST', path: '/api/tokens/transfer', fields: ['userCert', 'tokenId', 'toId'] },
    { name: 'Redeem Token', method: 'POST', path: '/api/tokens/redeem', fields: ['userCert', 'tokenId', 'ngoId'] },
    { name: 'Get Tokens By Bank', method: 'GET', path: '/api/tokens/byBank', fields: ['userCert', 'bankId'] },
    { name: 'Get Tokens By Donor', method: 'GET', path: '/api/tokens/byDonor', fields: ['userCert', 'donorId', 'bankId'] }
  ],
  Pinata: [
    { name: 'Pin JSON', method: 'POST', path: '/api/pinata/json', fields: ['key', 'value'], customBody: 'jsonPair' },
    { name: 'Pin Image (Generate Badge)', method: 'POST', path: '/api/pinata/image', fields: ['name', 'role', 'amount', 'message', 'qrData'] }
  ],
  Misc: [
    { name: 'Health Check', method: 'GET', path: '/health', fields: [] }
  ]
};

const FIELD_HINTS = {
  userCert: 'Enrolled wallet identity (examples: govUserTom, bank001, donor001, ngo001).',
  donorId: 'Donor business ID (example: donor001).',
  ownerId: 'Current token owner ID (usually donor ID, e.g. donor001).',
  donorUserCert: 'Optional cert used for Donate step; if empty, userCert is reused.',
  ngoId: 'NGO ID from fund/user registration (example: ngo2).',
  bankId: 'Bank ID from registration (example: bank001).',
  fundId: 'Fund ID (example: fund001).',
  tokenId: 'Exact tokenId returned from Issue Token response.',
  toId: 'Receiver ID. For donate flow this should match fund NGO ID.',
  amount: 'Positive numeric amount. For Donate must be <= token remainingAmount.',
  fundTarget: 'Target amount for the fund (numeric string, e.g. 5000).',
  name: 'Display/legal name for entity.',
  email: 'Valid email address.',
  alias: 'Optional donor alias.',
  regNo: 'NGO registration number.',
  branch: 'Bank branch name.',
  ifscCode: 'Bank IFSC code.',
  title: 'Fund title (example: Medical Aid).',
  purpose: 'Fund purpose/description.',
  description: 'Expense description or NGO description depending on operation.',
  spenderId: 'Vendor/spender identifier.',
  govUserId: 'Government user ID (example: GOV001).',
  designation: 'Role/designation text (example: Officer).',
  role: 'Badge role label (example: Donor, NGO, Bank).',
  message: 'Free text message shown in badge metadata.',
  qrData: 'QR payload text. Example: DonorID:donor001|fundId:fund001|Amount:300',
  key: 'Top-level JSON key for pin JSON.',
  value: 'JSON string or plain text value for the key.',
};

const FIELD_PLACEHOLDERS = {
  userCert: 'govUserTom',
  donorUserCert: 'donor001',
  donorId: 'donor001',
  ownerId: 'donor001',
  ngoId: 'ngo2',
  bankId: 'bank001',
  fundId: 'fund001',
  tokenId: 'TOKEN_bank001_donor001_<txId>',
  toId: 'ngo2',
  amount: '1000',
  fundTarget: '5000',
  govUserId: 'GOV001',
};

const OPERATION_HINTS = {
  'Donate': 'Use donor userCert + donorId + tokenId. Ensure token is transferred to this fund NGO and amount is within remaining balance.',
  'Donate (One Shot)': 'Single call that runs Issue -> Transfer(to fund NGO) -> Donate. userCert should be bank cert; donorUserCert is optional.',
  'Transfer Token': 'Call after Issue Token. Set toId to target NGO ID used by the fund you will donate into.',
  'Issue Token': 'Creates token owned by ownerId with full remaining balance.',
  'Get Tokens By Donor': 'Use donorId. Add bankId to avoid role restrictions when querying all banks.',
  'Get Tokens By Bank': 'Returns all tokens issued by bankId.',
  'Create Fund': 'Use NGO cert/user and keep ngoId consistent with later token transfer toId.',
};

const domainSelect = document.getElementById('domainSelect');
const operationSelect = document.getElementById('operationSelect');
const operationForm = document.getElementById('operationForm');
const methodBadge = document.getElementById('methodBadge');
const pathPreview = document.getElementById('pathPreview');
const operationHint = document.getElementById('operationHint');
const responseBox = document.getElementById('responseBox');
const sendBtn = document.getElementById('sendBtn');
const baseUrlInput = document.getElementById('baseUrl');

function init() {
  const domains = Object.keys(API_DEFINITIONS);
  domains.forEach((domain) => {
    const option = document.createElement('option');
    option.value = domain;
    option.textContent = domain;
    domainSelect.appendChild(option);
  });

  domainSelect.addEventListener('change', populateOperations);
  operationSelect.addEventListener('change', renderFormForCurrentOperation);
  sendBtn.addEventListener('click', sendRequest);

  populateOperations();
}

function populateOperations() {
  const selectedDomain = domainSelect.value || Object.keys(API_DEFINITIONS)[0];
  const operations = API_DEFINITIONS[selectedDomain];

  operationSelect.innerHTML = '';
  operations.forEach((op, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = op.name;
    operationSelect.appendChild(option);
  });

  renderFormForCurrentOperation();
}

function getCurrentOperation() {
  const domain = domainSelect.value;
  const operationIndex = Number(operationSelect.value || 0);
  return API_DEFINITIONS[domain][operationIndex];
}

function renderFormForCurrentOperation() {
  const operation = getCurrentOperation();
  methodBadge.textContent = operation.method;
  methodBadge.className = `badge ${operation.method.toLowerCase() === 'get' ? 'get' : ''}`;
  pathPreview.textContent = operation.path;
  operationHint.textContent = OPERATION_HINTS[operation.name] || 'Fill required fields, then send request. Path params are replaced from same-named fields.';

  operationForm.innerHTML = '';

  operation.fields.forEach((field) => {
    const wrapper = document.createElement('div');
    if (field === 'message' || field === 'qrData' || field === 'value') {
      wrapper.classList.add('full');
    }

    const label = document.createElement('label');
    label.textContent = field;

    let input;
    if (field === 'message' || field === 'qrData' || field === 'value') {
      input = document.createElement('textarea');
    } else {
      input = document.createElement('input');
      input.type = 'text';
    }

    input.name = field;
    input.placeholder = FIELD_PLACEHOLDERS[field] || field;

    const fieldHint = document.createElement('p');
    fieldHint.className = 'hint field-hint';
    fieldHint.textContent = FIELD_HINTS[field] || 'Enter value.';

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(fieldHint);
    operationForm.appendChild(wrapper);
  });
}

function collectValues() {
  const formData = new FormData(operationForm);
  const values = {};
  for (const [key, value] of formData.entries()) {
    const trimmed = String(value).trim();
    if (trimmed !== '') {
      values[key] = trimmed;
    }
  }
  return values;
}

function getPathParams(path) {
  const matches = path.match(/:([A-Za-z0-9_]+)/g) || [];
  return matches.map((token) => token.slice(1));
}

function fillPathParams(path, values) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, paramName) => {
    const value = values[paramName];
    return encodeURIComponent(value || '');
  });
}

function appendQuery(url, values, pathParamNames) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (!pathParamNames.includes(key)) {
      query.append(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `${url}?${queryString}` : url;
}

function makeBody(operation, values) {
  if (operation.customBody === 'jsonPair') {
    const key = values.key || 'sampleKey';
    const rawValue = values.value || '';
    try {
      return { [key]: JSON.parse(rawValue) };
    } catch {
      return { [key]: rawValue };
    }
  }

  return values;
}

async function sendRequest() {
  const operation = getCurrentOperation();
  const values = collectValues();
  const baseUrl = (baseUrlInput.value || '').trim().replace(/\/$/, '');

  if (!baseUrl) {
    responseBox.textContent = 'Please provide API Base URL.';
    return;
  }

  const pathParamNames = getPathParams(operation.path);
  let endpoint = fillPathParams(operation.path, values);

  if (operation.method === 'GET') {
    endpoint = appendQuery(endpoint, values, pathParamNames);
  }

  const url = `${baseUrl}${endpoint}`;

  const requestOptions = {
    method: operation.method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (operation.method !== 'GET') {
    requestOptions.body = JSON.stringify(makeBody(operation, values));
  }

  responseBox.textContent = `Sending ${operation.method} ${url} ...`;

  try {
    const response = await fetch(url, requestOptions);
    const text = await response.text();
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    responseBox.textContent = JSON.stringify(
      {
        status: response.status,
        ok: response.ok,
        url,
        response: parsed
      },
      null,
      2
    );
  } catch (error) {
    responseBox.textContent = JSON.stringify({ error: error.message, url }, null, 2);
  }
}

init();

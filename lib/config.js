export const ADDRESS_ENV={first:"SERVICE_COURT_ADDRESS",second:"REPUTATION_LEDGER_ADDRESS"};
export const METHODS={
  "first": {
    "get_job": [
      "id"
    ],
    "reputation_permission": [
      "id"
    ],
    "stats": []
  },
  "second": {
    "get_profile": [
      "address"
    ],
    "get_outcome": [
      "id"
    ],
    "outcome_for": [
      "id"
    ],
    "stats": []
  }
};
export function readConfig(env){return {first:env[ADDRESS_ENV.first]||'',second:env[ADDRESS_ENV.second]||''}}

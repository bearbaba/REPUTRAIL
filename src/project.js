export const project = {
  "id": "reputrail",
  "name": "REPUTRAIL",
  "eyebrow": "PROOF-CARRYING AGENT REPUTATION",
  "hero": "Every outcome has a reason.",
  "intro": "Track agent service quality through signed job evidence, contestable verdicts and a reputation ledger built from recorded events—not AI-invented scores.",
  "scope": "Studionet synthetic service agreements. Agent is a wallet-controlled role; no attestation of autonomous agent execution, off-chain deliverables or real-world identity. Client acceptance is a client statement; dispute verdicts rely solely on frozen supplied evidence.",
  "labels": [
    "ServiceCourt",
    "ReputationLedger"
  ],
  "cards": [
    [
      "01",
      "Define a job",
      "Client signs a frozen specification and reference input."
    ],
    [
      "02",
      "Deliver work",
      "Assigned agent signs the exact content hash."
    ],
    [
      "03",
      "Accept or dispute",
      "Client accepts directly or requests AI consensus."
    ],
    [
      "04",
      "Record outcome",
      "Ledger records a verified event exactly once."
    ]
  ],
  "forms": [
    {
      "method": "open_job",
      "scope": "first",
      "title": "Open agent service job",
      "role": "Client",
      "subtitle": "Lock service requirements and assign the agent wallet.",
      "fields": [
        [
          "agent",
          "Agent wallet",
          "address"
        ],
        [
          "agreement",
          "Service agreement",
          "textarea"
        ],
        [
          "reference_input",
          "Reference fixture",
          "textarea"
        ]
      ],
      "preset": "job"
    },
    {
      "method": "submit_delivery",
      "scope": "first",
      "title": "Submit signed delivery",
      "role": "Agent",
      "subtitle": "Exact output and SHA-256 are signed and frozen.",
      "fields": [
        [
          "job_id",
          "Job ID",
          "number"
        ],
        [
          "delivery",
          "Agent output",
          "textarea"
        ],
        [
          "delivery_sha256",
          "SHA-256 of exact output",
          "hash"
        ]
      ],
      "hashSource": "delivery",
      "preset": "delivery"
    },
    {
      "method": "open_dispute",
      "scope": "first",
      "title": "Open dispute",
      "role": "Client",
      "subtitle": "One client-signed claim freezes the contested issue.",
      "fields": [
        [
          "job_id",
          "Job ID",
          "number"
        ],
        [
          "claim",
          "Specific disputed requirement",
          "textarea"
        ]
      ],
      "preset": "dispute"
    },
    {
      "method": "adjudicate",
      "scope": "first",
      "title": "Consensus adjudication",
      "role": "Any wallet",
      "subtitle": "Independent validators decide AGENT_AT_FAULT, CLAIM_UNSUPPORTED or REVIEW_REQUIRED.",
      "fields": [
        [
          "job_id",
          "Job ID",
          "number"
        ]
      ]
    },
    {
      "method": "accept_delivery",
      "scope": "first",
      "title": "Accept an undisputed delivery",
      "role": "Client",
      "subtitle": "Alternative to the dispute branch; acceptance is not an AI-certified quality claim.",
      "fields": [
        [
          "job_id",
          "Job ID",
          "number"
        ]
      ]
    },
    {
      "method": "record_outcome",
      "scope": "second",
      "title": "Record eligible reputation event",
      "role": "Any wallet",
      "subtitle": "Only a finalized eligible court outcome can be recorded once; REVIEW_REQUIRED is blocked.",
      "fields": [
        [
          "job_id",
          "Job ID",
          "number"
        ]
      ]
    }
  ],
  "presets": {
    "job": {
      "agreement": "An agent must produce one JSON report of the approved invoice IDs and their exact total from the reference fixture. Approved entries are INV-1 for 12 units and INV-3 for 8 units, so the only correct approvedTotal is 20. The JSON must include approvedIds and approvedTotal; duplicates, missing IDs or totals other than 20 violate the agreement.",
      "reference_input": "{\"invoices\":[{\"id\":\"INV-1\",\"amount\":12,\"approved\":true},{\"id\":\"INV-2\",\"amount\":7,\"approved\":false},{\"id\":\"INV-3\",\"amount\":8,\"approved\":true}]}"
    },
    "delivery": {
      "job_id": 1,
      "delivery": "{\"approvedIds\":[\"INV-1\",\"INV-3\"],\"approvedTotal\":27,\"description\":\"Synthetic agent report with an incorrect approved total.\"}"
    },
    "dispute": {
      "job_id": 1,
      "claim": "The signed report has approvedTotal=27, but the locked source has only approved invoices INV-1=12 and INV-3=8, totaling exactly 20. The delivery violates the explicit total requirement; decide responsibility from these frozen facts."
    }
  },
  "reads": [
    [
      "Job",
      "first",
      "get_job",
      [
        "id"
      ]
    ],
    [
      "Court permission",
      "first",
      "reputation_permission",
      [
        "id"
      ]
    ],
    [
      "Agent profile",
      "second",
      "get_profile",
      [
        "address"
      ]
    ],
    [
      "Outcome by job",
      "second",
      "outcome_for",
      [
        "id"
      ]
    ],
    [
      "Outcome by ID",
      "second",
      "get_outcome",
      [
        "id"
      ]
    ],
    [
      "Job totals",
      "first",
      "stats",
      []
    ],
    [
      "Ledger totals",
      "second",
      "stats",
      []
    ]
  ]
};

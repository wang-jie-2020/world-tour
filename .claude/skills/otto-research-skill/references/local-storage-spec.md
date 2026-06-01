# Local Storage Spec

Use this spec to persist conclusions, confidence evidence, and key data for each investigation.

## 1) Folder Convention

Create one folder per investigation:

`research/YYYY-MM-DD-topic-slug/`

Required files:

- `report.md`
- `evidence-matrix.md`
- `conclusions.json`
- `confidence-sources.json`
- `key-data.csv`
- `meta.json`

## 2) `conclusions.json` (Required)

```json
{
  "topic": "string",
  "generated_at": "YYYY-MM-DD",
  "conclusions": [
    {
      "conclusion_id": "K1",
      "statement": "string",
      "status": "verified|disputed|unverified",
      "confidence_score": 0,
      "confidence_level": "high|medium|low",
      "claim_ids": ["C1"],
      "source_ids": ["S1", "S2"],
      "scope": "where this is applicable",
      "caveats": ["known limitation or uncertainty"],
      "last_verified_at": "YYYY-MM-DD"
    }
  ]
}
```

## 3) `confidence-sources.json` (Required)

```json
{
  "sources": [
    {
      "source_id": "S1",
      "title": "string",
      "url": "https://...",
      "source_type": "official-doc|official-repo|paper|media|blog|forum",
      "source_region": "cn-accessible|overseas-only|unknown",
      "published_at": "YYYY-MM-DD",
      "independence_group": "official|vendor|community|media|academic",
      "quality_tier": 1,
      "supports_claim_ids": ["C1"],
      "confidence_reason": "why this source increases confidence",
      "notes": "optional"
    }
  ]
}
```

Rules:

1. Reposts of the same origin share one `independence_group`.
2. `quality_tier`: 1 is highest quality.
3. Every verified conclusion should link to at least 2 independent sources.

## 4) `key-data.csv` (Required)

Columns:

`data_id,metric,value,unit,context,date_or_version,source_id,claim_id,note`

Example:

```csv
data_id,metric,value,unit,context,date_or_version,source_id,claim_id,note
D1,p95 latency,38,ms,baseline test on 4c8g,2026-05,S2,C3,from official benchmark
```

## 5) `meta.json` (Recommended)

```json
{
  "topic": "string",
  "owner": "string",
  "objective": "learn|decision|writing",
  "sub_questions": ["..."],
  "search_queries": ["..."],
  "tools_used": ["web_search", "browser", "firecrawl", "exa"],
  "time_range": "last 12 months",
  "environment": "language/framework/runtime versions",
  "network_tier": "direct|restricted|highly-restricted",
  "degradation_strategy": "none|source-relaxed|official-unverified|local-only"
}
```

## 6) Completion Checklist

- `conclusions.json` exists and all conclusions map to claim/source IDs.
- `confidence-sources.json` exists and records confidence reasons.
- `key-data.csv` exists and includes all load-bearing metrics.
- `report.md` key findings can be traced to local files.

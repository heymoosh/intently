# Metrics Capture

**Type:** Reference doc — running list of in-the-moment metric ideas, synthesized later into a full outcome/evaluation metrics framework for Intently.

*Created: April 21, 2026.*

---

## Purpose

CRISP-DM framing: every AI metric we optimize for is a proxy we *believe* correlates with a business outcome. Those correlations are hypotheses, and they need to be stated explicitly before we ship — otherwise we're optimizing numbers without knowing whether they predict what we actually care about.

This doc is the catch-net for those hypotheses. Whenever a tradeoff conversation surfaces a "we should build a metric around this" moment, it lands here with the context it was born in, while the reasoning is still fresh. Later, we synthesize the running list into a coherent evaluation framework that the AI eval batch steward and outcome metrics steward read from.

## How to use this doc

**When to capture:** any moment during design, scoping, tradeoff discussion, or review where a metric idea surfaces. Don't filter in the moment — if it feels relevant, drop it in. Noise here is cheap; loss is expensive.

**What to capture:**
- Date and short context (what were we talking about when this came up).
- The proposed metric or question.
- The hypothesized business outcome it would predict, if we have one. "I don't know yet" is a valid entry — the point is to capture the raw idea, synthesis comes later.
- Which skill, feature, or agent it applies to.

**Format per entry:**

```
### [YYYY-MM-DD] — short descriptor

**Context:** [what we were discussing when this came up]

**Metric idea:** [the thing to measure]

**Hypothesized outcome correlation:** [what business outcome we think this predicts — or "TBD" if we don't know yet]

**Applies to:** [skill / feature / agent]

**Notes:** [anything else worth preserving — gut feelings, concerns, related metrics]
```

## Captured ideas

*(Drop new entries at the top — newest first.)*

---

## Synthesis queue

Ideas that have accumulated enough signal to be clustered, deduped, or hardened into the framework. Filled in during mid-week synthesis passes.

---

## Final metrics framework

Filled in once the captured ideas have converged. This is what the outcome metrics steward and AI eval batch steward will read from for production-grade evaluation.

**Structure to populate:**

- **Output-level AI metrics** (what the model produces): relevance, faithfulness, safety, consistency, latency, cost per successful result — per skill.
- **Outcome-level business metrics** (what the user actually does): task completion, retention, correction rate, escalation rate, satisfaction proxy.
- **Hypothesis map:** which output metric correlates with which outcome metric, and how confident we are in that correlation.
- **Measurement plan:** how we'd collect each metric post-launch, and which ones can be approximated during the hackathon with synthetic or self-generated data.

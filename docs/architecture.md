# Architecture

```text
React + Vite (Three.js intro, GSAP transitions)
                 |
                 v
       Express REST API (Node)
        |        |         |
        |        |         +--> optional MongoDB experiment history
        |        |
        |        +--> CSV dataset summary / validation
        |
        v
   Python FastAPI ML service
        |
        +--> Pandas aggregation of replicate rows
        +--> scikit-learn per-metric regression baseline
        +--> nearest-observation support/confidence heuristic

CSV experiments provide extrusion/texture evidence. Ingredient profiles for price and nutrition are user/source supplied and must include traceable source fields.
```

## Version boundaries

- V1: experiment browser, simulation/prediction, ranked 50:50 blends, confidence explanation, suggested next tests.
- V2: conversational lab assistant / voice interaction can call the same structured APIs. LLMs should explain or plan tests, not invent lab measurements.

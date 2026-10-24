# AWS Hackathon environment notes

These are implementation notes summarized from the supplied `AWS PARTICIPANT GUIDE.pdf` (Hack the Fork x AWS), not a substitute for the event console's live permissions.

- Keep AWS resources in `us-east-1` (N. Virginia); the guide says other regions can return AccessDenied.
- The guide lists Amazon Bedrock models available to participant accounts and recommends starting with a fast model such as Amazon Nova Micro/Lite or Claude Haiku 4.5. Model permissions are allowlisted, so confirm invocation in the participant account before integrating it.
- GPU instances are blocked; this MVP uses classical tabular scikit-learn models on CPU, which the guide explicitly allows.
- Keep Bedrock traffic under approximately one request per second per person; cache or reuse results rather than calling an LLM repeatedly during slider movements.
- No personal/sensitive data; use only public, anonymized or synthetic data as allowed.
- Never commit temporary AWS credentials, tokens, passwords or `.env` files. Do not make S3 buckets public.
- The account and its resources are deleted at the end of the event window (up to 72 hours), so push code frequently and save a demo video and copies of required data before the event ends.

V1 does not require Bedrock calls: its numerical lab results come from the experiment dataset and Python model. A future explanation assistant can use an allowed Bedrock model to explain already-computed numbers, but it must not invent measurements or silently override the numerical engine.

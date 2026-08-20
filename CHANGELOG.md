# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Reuse the `pi-ai` runtime supplied by DeepSeek Harness instead of installing a duplicate provider SDK tree.
- Install Schemastery as the provider's direct runtime dependency.
- Mark Harness-supplied peers as optional to avoid false missing-peer warnings during profile installation.
- Refresh the user-facing feature, installation, usage, update, and uninstall documentation.

## 0.1.0

- Add the native SinapisAI provider for DeepSeek Harness.
- Add Router and searchable model discovery.
- Synchronize model capacities and image-input support.
- Add streaming, tool-call, credential-store, and routed-model support.

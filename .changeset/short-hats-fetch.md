---
'sku': major
---

Throw on invalid `--config` file path

**BREAKING CHANGE**:

`sku` no longer falls back to default sku config files when the config file specified with the `--config` flag cannot be found.
It will now throw an error and exit the program instead.

This ensures users are aware that the configuration file is either missing or incorrectly specified, rather than silently falling back to a default configuration that may not be appropriate for their use case.

If you encounter this error, ensure that the `--config` flag points to a valid configuration file.

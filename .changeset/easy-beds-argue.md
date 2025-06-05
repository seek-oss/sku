---
'sku': major
---

`sku` no longer defaults to using a default sku config when it can not find the config file specified with the `--config` flag.
It will now instead throw an error and exit the program.

This change is made to ensure that users are aware that the configuration file is either missing or incorrectly specified, rather than silently falling back to a default configuration that may not be appropriate for their use case.

If you encounter this error, please ensure that the `--config` flag points to a valid configuration file.

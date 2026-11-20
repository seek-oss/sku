# Benchmark

Measures the cost of removing assertions during a Vite build with this plugin, against a baseline build with no plugin.

The benchmark generates a project of `BENCH_FILE_COUNT` modules (default `10000`), each at least 100 lines, with a mix of `assert`/`power-assert` import styles and assertion calls.
It then builds the project with Vite for each variant and checks that no assertions survive in the output.
`BENCH_ITERATIONS` sets the number of timed iterations (default `5`).

```sh
pnpm bench
```

Each run below is appended with a timestamp.
"Overhead" is the mean build time minus the baseline build with no plugin, which isolates the cost of the plugin itself.

> [!NOTE]
> The benchmarks compare this plugin with the original `babel-plugin-unassert`.
> However, the original plugin is no longer installed in the repo as the entire point of this package is to replace it.
> Future benchmark runs are unlikely to be relevant to the original babel plugin, but if necessary it can be manually re-installed and used in the suite.

## 2026-11-20 00:03 UTC

This run also compared against `babel-plugin-unassert` through `@rolldown/plugin-babel`.
Those variants have since been removed from the benchmark, so the Babel rows below cannot be reproduced with the current code.

- Project: 10,000 modules, at least 100 lines each, 25,051 assertions
- Machine: Apple M4 Pro (14 cores), macOS 26.7.3, Node 26.12.1
- Versions: `vite` 8.3.5, `@rolldown/plugin-babel` 0.3.1, `babel-plugin-unassert` 3.2.0 (Babel variants only)
- Iterations: 5 (after 1 warmup)

### Summary

| Variant                                                       | Mean build time | Overhead vs baseline | Total vs baseline | Total vs this plugin |
| ------------------------------------------------------------- | --------------: | -------------------: | ----------------: | -------------------: |
| Baseline (no plugin)                                          |           0.67s |                    - |              1.0x |                    - |
| **This plugin** (oxc, raw transfer, default)                  |           0.88s |               +0.21s |              1.3x |                 1.0x |
| This plugin (oxc, no raw transfer)                            |           1.91s |               +1.23s |              2.8x |                 2.2x |
| `@rolldown/plugin-babel` + `babel-plugin-unassert` (parallel) |           5.16s |               +4.49s |              7.7x |                 5.9x |
| `@rolldown/plugin-babel` + `babel-plugin-unassert`            |           9.47s |               +8.80s |             14.1x |                10.8x |

### Reading the results

- With default options, this plugin adds about 0.2s to a 10,000-module build, a 31% increase over a build with no plugin.
- The Babel approach makes the same build 5.9x (parallel) to 10.8x (default) slower than this plugin.
- Looking only at the cost of the plugin, the default configuration costs about 40x less than Babel (0.21s against 8.80s) and about 20x less than parallel Babel (0.21s against 4.49s).
- Raw transfer (the experimental `oxc-parser` fast AST path, on by default) accounts for most of the speed: turning it off makes the plugin about 2.2x slower, though it is still about 5x faster than Babel.
- The timings are stable: the relative margin of error is under 2% for the oxc variants and under 7% for the Babel variants.

<details>
<summary>Raw vitest output</summary>

```
   name                                                           hz       min        max      mean       p75       p99       p995       p999     rme  samples
   baseline: no unassert plugin                               1.4874    669.05     678.21    672.33    672.34    677.97     678.09     678.18  ±0.64%        5   fastest
   @sku-lib/rolldown-plugin-unassert (oxc, raw transfer)      1.1374    866.22     898.38    879.40    884.57    897.83     898.10     898.32  ±1.88%        5
   @sku-lib/rolldown-plugin-unassert (oxc, no raw transfer)   0.5250  1,882.70   1,937.43  1,905.16  1,919.40  1,936.71   1,937.07   1,937.36  ±1.50%        5
   @rolldown/plugin-babel + babel-plugin-unassert (parallel)  0.1940  4,924.55   5,575.22  5,164.04  5,281.80  5,563.48   5,569.35   5,574.05  ±6.39%        5
   @rolldown/plugin-babel + babel-plugin-unassert             0.1056  9,242.36  10,021.84  9,474.70  9,403.53  9,997.11  10,009.48  10,019.37  ±4.10%        5   slowest
```

Times are in milliseconds.

</details>

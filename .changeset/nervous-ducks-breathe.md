---
'sku': patch
---

Prevents typescript from being upgraded to 4.5.x

Typescript 4.5 has caused a lot of issues with packages included with sku (braid, vanilla-extract) that are caused by a regression that's been introduced in the type checker. It seems to be fixed in 4.6.0-dev, but that won't be available until late February.

To prevent things blowing up in the meantime, the version of typescript has been update to keep it below 4.5, at least until a patch is released in 4.5
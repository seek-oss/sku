---
'sku': minor
---

Add rootResolution config option and disable for compile packages

By default, sku allows you to import modules from the root folder of your repo. e.g. `import something from 'src/modules/something'`. Unfortunately, these kinds of imports only work for apps. In packages, the imports will work locally, but fail when consumed from `node_modules`. 

Adding `"skuCompilePackage": true` to your `package.json` will now disable this behaviour by default. You can also toggle the behaviour by setting `rootResolution` in your sku config. 

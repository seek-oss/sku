// @ts-check

const assert = require('node:assert');
const { readFile, writeFile } = require('node:fs/promises');
const t = require('@babel/types');
const { parseModule, builders, generateCode } = require('magicast');
const { getConfigFromVariableDeclaration } = require('magicast/helpers');

const debug = require('debug');
const log = debug('sku:update-sku-config');

const prettier = require('prettier');
const prettierConfig = require('../config/prettier/prettierConfig.js');

class SkuConfigUpdater {
  /** @typedef {import("sku").SkuConfig} SkuConfig */
  /** @typedef {import("magicast").ProxifiedObject<SkuConfig>} ProxifiedSkuConfig */
  /** @typedef {import("@babel/types").ObjectExpression} ObjectExpression */
  /** @typedef {import("@babel/types").VariableDeclarator} VariableDeclarator */

  /** @typedef {{type: 'esm', configAst: ProxifiedSkuConfig}} EsmConfig */
  /** @typedef {{type: 'esm-non-literal', configAst: ProxifiedSkuConfig, configDeclaration: VariableDeclarator}} EsmNonLiteralConfig */
  /** @typedef {{type: 'cjs', configAst: ObjectExpression }} CjsConfig */

  /** @type {EsmConfig | EsmNonLiteralConfig | CjsConfig} The AST or AST proxy of the sku config */
  #config;
  /** The path to the sku config being modified */
  #path;
  /** The parsed sku config file from magicast. Used for serializing the AST after updating it. */
  #module;

  /**
   * @param {object} options
   * @param {string} options.path - An absolute path to a sku config
   * @param {string} options.contents - The contents of the sku config
   */
  constructor({ path, contents }) {
    this.#path = path;

    const skuConfigModule = parseModule(contents);
    this.#module = skuConfigModule;

    if (typeof skuConfigModule.exports.default === 'undefined') {
      /** @type {ObjectExpression} */
      let configAst;

      log(
        'No default export found in sku config. Config is either CJS or invalid.',
      );

      t.assertProgram(skuConfigModule.$ast);
      const lastStatement = skuConfigModule.$ast.body.at(-1);
      t.assertExpressionStatement(lastStatement);

      const { expression } = lastStatement;
      t.assertAssignmentExpression(expression);
      t.assertMemberExpression(expression.left);
      t.assertIdentifier(expression.left.object, {
        name: 'module',
      });
      t.assertIdentifier(expression.left.property, {
        name: 'exports',
      });

      if (t.isObjectExpression(expression.right)) {
        configAst = expression.right;
      } else if (t.isIdentifier(expression.right)) {
        const skuConfigIdentifierName = expression.right.name;
        const skuConfigDeclaration = skuConfigModule.$ast.body.find(
          (node) =>
            t.isVariableDeclaration(node) &&
            t.isIdentifier(node.declarations[0].id) &&
            node.declarations[0].id.name === skuConfigIdentifierName,
        );
        assert(skuConfigDeclaration, 'Expected skuConfig to be defined');
        t.assertVariableDeclaration(skuConfigDeclaration);
        t.assertVariableDeclarator(skuConfigDeclaration.declarations[0]);
        t.assertObjectExpression(skuConfigDeclaration.declarations[0].init);
        configAst = skuConfigDeclaration.declarations[0].init;
      } else {
        throw new Error("Couldn't find config object in CJS sku config");
      }

      this.#config = {
        type: 'cjs',
        configAst,
      };
    } else {
      log('Found sku config with ESM export');

      if (skuConfigModule.exports.default.$type === 'object') {
        const configAst = skuConfigModule.exports.default;
        this.#config = {
          type: 'esm',
          configAst,
        };
      } else {
        const { declaration: configDeclaration, config: configAst } =
          getConfigFromVariableDeclaration(skuConfigModule);

        assert(configAst, 'Expected skuConfig to be defined');
        this.#config = {
          type: 'esm-non-literal',
          configAst,
          configDeclaration,
        };
      }
    }
  }

  /**
   * Creates a new instance of SkuConfigUpdater from a file path
   *
   * @param {string} path - An absoulte path to a sku config
   */
  static async fromFile(path) {
    const contents = await readFile(path, 'utf8');

    return new SkuConfigUpdater({ path, contents });
  }

  /**
   * Updates `property` in sku config with the provided `value`. Inserts the `property` and `value` if it doesn't exist.
   *
   * This method does not write the changes to the file system. Use `commitConfig` to do that.
   *
   * @template {keyof SkuConfig} T
   * @param {{property: T, value: SkuConfig[T]}} options
   */
  upsertConfig({ property, value }) {
    if (this.#config.type === 'cjs') {
      const propertyToUpdate = this.#config.configAst.properties.find(
        (prop) =>
          t.isObjectProperty(prop) &&
          t.isIdentifier(prop.key) &&
          prop.key.name === property,
      );

      if (propertyToUpdate) {
        t.assertObjectProperty(propertyToUpdate);
        propertyToUpdate.value = builders.literal(value);
      } else {
        const {
          properties: [propertyLiteral],
        } = builders.literal({
          [property]: value,
        });
        this.#config.configAst.properties.push(propertyLiteral);
      }

      return;
    }

    // @ts-expect-error We have to mutate here because of magicast, but typescript complains
    this.#config.configAst[property] = value;

    if (this.#config.type === 'esm') {
      return;
    }

    // At this point `this.#config.type` is `esm-non-literal`

    // Copied from magicast/helpers https://github.com/unjs/magicast/blob/50e2207842672e2c1c75898f0b1b97909f3b6c92/src/helpers/vite.ts#L129
    // @ts-expect-error This works because of recast magic
    this.#config.configDeclaration.init = generateCode(
      this.#config.configAst,
    ).code;
  }

  /**
   * Writes the current state of the sku config to the file system
   */
  async commitConfig() {
    const newContents = this.#module.generate().code;
    const formattedNewContents = prettier.format(newContents, {
      parser: 'typescript',
      ...prettierConfig,
    });

    await writeFile(this.#path, formattedNewContents);
  }
}

module.exports = { SkuConfigUpdater };

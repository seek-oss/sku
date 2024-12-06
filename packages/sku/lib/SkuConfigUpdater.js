// @ts-check

import assert from 'node:assert';
import { readFile, writeFile } from 'node:fs/promises';
import {
  assertProgram,
  assertExpressionStatement,
  assertAssignmentExpression,
  assertMemberExpression,
  assertIdentifier,
  isObjectExpression,
  isIdentifier,
  isVariableDeclaration,
  assertVariableDeclaration,
  assertVariableDeclarator,
  assertObjectExpression,
  isObjectProperty,
  assertObjectProperty,
} from '@babel/types';
import { parseModule, builders, generateCode } from 'magicast';
import { getConfigFromVariableDeclaration } from 'magicast/helpers';

import debug from 'debug';
const log = debug('sku:update-sku-config');

import prettier from 'prettier';
import prettierConfig from '../config/prettier/prettierConfig.js';

export class SkuConfigUpdater {
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

      assertProgram(skuConfigModule.$ast);
      const lastStatement = skuConfigModule.$ast.body.at(-1);
      assertExpressionStatement(lastStatement);

      const { expression } = lastStatement;
      assertAssignmentExpression(expression);
      assertMemberExpression(expression.left);
      assertIdentifier(expression.left.object, {
        name: 'module',
      });
      assertIdentifier(expression.left.property, {
        name: 'exports',
      });

      if (isObjectExpression(expression.right)) {
        configAst = expression.right;
      } else if (isIdentifier(expression.right)) {
        const skuConfigIdentifierName = expression.right.name;
        const skuConfigDeclaration = skuConfigModule.$ast.body.find(
          (node) =>
            isVariableDeclaration(node) &&
            isIdentifier(node.declarations[0].id) &&
            node.declarations[0].id.name === skuConfigIdentifierName,
        );
        assert(skuConfigDeclaration, 'Expected skuConfig to be defined');
        assertVariableDeclaration(skuConfigDeclaration);
        assertVariableDeclarator(skuConfigDeclaration.declarations[0]);
        assertObjectExpression(skuConfigDeclaration.declarations[0].init);
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
          isObjectProperty(prop) &&
          isIdentifier(prop.key) &&
          prop.key.name === property,
      );

      if (propertyToUpdate) {
        assertObjectProperty(propertyToUpdate);
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
    const formattedNewContents = await prettier.format(newContents, {
      parser: 'typescript',
      ...prettierConfig,
    });

    await writeFile(this.#path, formattedNewContents);
  }
}

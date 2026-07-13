import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import { resolveManifestModuleId } from '../../../helpers/resolveManifestModuleId.js';

export const injectModuleID = ({
  callPath,
  id,
}: {
  callPath: NodePath<t.CallExpression>;
  id: string;
}) => {
  let injected = false;
  const loadableFunctionArgsPath = callPath.get('arguments');
  loadableFunctionArgsPath[0].traverse({
    CallExpression(importCallPath) {
      if (importCallPath.get('callee').isImport()) {
        const stringLiteralNodePath = importCallPath
          .get('arguments')
          .find((arg) => arg.isStringLiteral());
        if (stringLiteralNodePath) {
          const importPath = stringLiteralNodePath.node.value;
          const relativePath = resolveManifestModuleId({
            importerId: id,
            importPath,
          });

          if (!relativePath) {
            return;
          }

          // Inject the ssr key into the loadable function call options
          const ssrKeyObjectProperty = t.objectProperty(
            t.identifier('ssr'),
            t.memberExpression(
              t.memberExpression(t.identifier('import'), t.identifier('meta')),
              t.identifier('env.SSR'),
            ),
          );

          if (loadableFunctionArgsPath.length === 1) {
            callPath.node.arguments.push(
              t.objectExpression([ssrKeyObjectProperty]),
            );
          } else {
            loadableFunctionArgsPath.find((argPath) => {
              if (argPath.isObjectExpression()) {
                const properties = argPath.node.properties;
                properties.push(ssrKeyObjectProperty);
              }
            });
          }

          callPath.node.arguments.push(t.stringLiteral(relativePath));

          callPath.get('callee').replaceWith(t.identifier('loadable'));

          injected = true;
        }
      }
    },
  });

  return injected;
};

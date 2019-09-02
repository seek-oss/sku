import { ComponentProps } from 'react';
import loadable from 'sku/@loadable/component';
import { BraidProvider } from 'braid-design-system';

type Theme = ComponentProps<typeof BraidProvider>['theme'];

type BraidThemeLoader = React.ComponentType<{
  themeName: string;
  children: (theme: Theme) => JSX.Element;
}>;
export const BraidThemeLoader: BraidThemeLoader = loadable.lib(props =>
  // @ts-ignore loadable can not currently type dynamic props
  import(`braid-design-system/themes/${props.themeName}`).then(
    ({ default: theme }) => theme,
  ),
);

import './index.css';
import { Suspense } from 'react';
import { loadable } from 'sku/@vite-preload';

function slowImport(promise) {
  return () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(promise()), 1000);
    });
  };
}

const ModuleFileLazy = loadable(slowImport(() => import('./ModuleFile.jsx')));

export const App = () => (
  <div>
    test this thing here something
    <Suspense fallback={<div>Loading...</div>}>
      <ModuleFileLazy />
    </Suspense>
  </div>
);

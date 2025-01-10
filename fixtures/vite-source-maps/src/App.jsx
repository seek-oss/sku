import './index.css';
import { Suspense } from 'react';
import { lazy } from 'sku/vite-preload';

function slowImport(promise) {
  return () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(promise()), 1000);
    });
  };
}

const ModuleFileLazy = lazy(slowImport(() => import('./ModuleFile.jsx')));

const App = () => (
  <div>
    <Suspense fallback={<div>Loading...</div>}>
      <ModuleFileLazy />
    </Suspense>
  </div>
);

export default App;

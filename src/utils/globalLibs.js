const CDN_SOURCES = {
  d3: 'https://d3js.org/d3.v4.min.js',
  lodash: 'https://cdn.jsdelivr.net/lodash/4.17.4/lodash.min.js',
  dTree: 'https://cdn.jsdelivr.net/npm/d3-dtree/dist/dTree.min.js',
  dSeeder: 'https://cdn.jsdelivr.net/npm/dtree-seed@1.0.0/dist/dSeeder.min.js'
};

let librariesPromise = null;

const ensureGlobal = (moduleValue, globalKey) => {
  if (!moduleValue) {
    return null;
  }

  const value = moduleValue.default ?? moduleValue;

  if (typeof window !== 'undefined' && !window[globalKey]) {
    window[globalKey] = value;
  }

  return value;
};

export const loadExternalLibrary = (url, name) => {
  return new Promise((resolve, reject) => {
    if (window[name]) {
      resolve(window[name]);
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      resolve(window[name]);
    };

    script.onerror = () => {
      reject(new Error(`Error al cargar la librería ${name} desde ${url}`));
    };

    document.body.appendChild(script);
  });
};

const selectDTree = (moduleValue) => {
  if (!moduleValue) {
    return null;
  }

  const candidate = moduleValue.default ?? moduleValue;

  if (candidate?.init) {
    return candidate;
  }

  if (candidate?.dTree?.init) {
    return candidate.dTree;
  }

  return null;
};

const selectDSeeder = (moduleValue) => {
  if (!moduleValue) {
    return null;
  }

  const candidate = moduleValue.default ?? moduleValue;

  if (candidate?.seed) {
    return candidate;
  }

  if (candidate?.dSeeder?.seed) {
    return candidate.dSeeder;
  }

  return null;
};

const loadModules = async () => {
  const results = await Promise.allSettled([
    import('d3'),
    import('lodash'),
    import('d3-dtree'),
    import('dtree-seed')
  ]);

  const [d3Result, lodashResult, dTreeResult, dSeederResult] = results;

  const d3 = ensureGlobal(d3Result.status === 'fulfilled' ? d3Result.value : null, 'd3');
  const lodash = ensureGlobal(lodashResult.status === 'fulfilled' ? lodashResult.value : null, '_');
  const dTree = selectDTree(dTreeResult.status === 'fulfilled' ? dTreeResult.value : null);
  const dSeeder = selectDSeeder(dSeederResult.status === 'fulfilled' ? dSeederResult.value : null);

  if (typeof window !== 'undefined') {
    if (dTree && !window.dTree) {
      window.dTree = dTree;
    }

    if (dSeeder && !window.dSeeder) {
      window.dSeeder = dSeeder;
    }
  }

  if (d3 && lodash && dTree && dSeeder) {
    return { d3, dTree, dSeeder };
  }

  return null;
};

const loadFromCdn = async () => {
  await loadExternalLibrary(CDN_SOURCES.d3, 'd3');
  await loadExternalLibrary(CDN_SOURCES.lodash, '_');
  await loadExternalLibrary(CDN_SOURCES.dTree, 'dTree');
  await loadExternalLibrary(CDN_SOURCES.dSeeder, 'dSeeder');

  const { d3, dTree, dSeeder } = window;

  if (!d3 || !dTree || !dSeeder) {
    throw new Error('No se pudieron cargar las librerías de renderizado');
  }

  return { d3, dTree, dSeeder };
};

export const loadTreeLibraries = async () => {
  if (librariesPromise) {
    return librariesPromise;
  }

  librariesPromise = (async () => {
    const moduleLibraries = await loadModules();

    if (moduleLibraries) {
      return moduleLibraries;
    }

    return loadFromCdn();
  })();

  return librariesPromise;
};


export const checkLibrariesLoaded = () => {
  const { d3, dTree, dSeeder } = window;
  const allLoaded = !!(d3 && dTree && dSeeder);

  return {
    d3,
    dTree,
    dSeeder,
    allLoaded,
    missingLibraries: !allLoaded
      ? [
          !d3 ? 'd3' : null,
          !dTree ? 'dTree' : null,
          !dSeeder ? 'dSeeder' : null
        ]
          .filter(Boolean)
          .join(', ')
      : ''
  };
};

// Test helpers ---------------------------------------------------------------
// These functions are intentionally small "test-only" hooks that allow tests
// to inject minimal shims for d3/dTree/dSeeder and reset internal caches.
export const __setTestLibraries = ({ d3: d3Impl, dTree: dTreeImpl, dSeeder: dSeederImpl } = {}) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (d3Impl) window.d3 = d3Impl;
  if (dTreeImpl) window.dTree = dTreeImpl;
  if (dSeederImpl) window.dSeeder = dSeederImpl;

  // set librariesPromise to a resolved promise returning the injected libs
  librariesPromise = Promise.resolve({ d3: window.d3, dTree: window.dTree, dSeeder: window.dSeeder });
};

export const __resetTestLibraries = () => {
  if (typeof window === 'undefined') {
    librariesPromise = null;
    return;
  }
  try {
    delete window.d3;
    delete window.dTree;
    delete window.dSeeder;
  } catch {}
  librariesPromise = null;
};

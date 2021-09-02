export function getApiEndpoint() {
  return process.env.REACT_APP_API_URL;
}

const getAllMethods = (instance: any, cls: any) => {
  return Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter((name) => {
    let method = instance[name];
    return !(!(method instanceof Function) || method === cls);
  });
};

/**
 * Bind this for all methods in ES6 classes
 * https://gist.github.com/anhldbk/782e13de7f79b07e556a029a9ce49fa3
 */
export const binder = <T>(instance: T, cls: any) => {
  getAllMethods(instance, cls).forEach((mtd) => {
    (instance as any)[mtd] = (instance as any)[mtd].bind(instance);
  });

  return instance;
};

// https://stackoverflow.com/a/49857905/8439123
export function fetchWithTimeout(url: RequestInfo, options?: RequestInit, timeout = 15000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout)),
  ]);
}

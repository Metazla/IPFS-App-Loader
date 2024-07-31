# IPNS App Loader

The IPNS App Loader is a decentralized web browser that enables in-browser access to IPFS content. 
This project aims to provide a seamless experience for browsing decentralized websites directly from your browser.
It leverages a service worker that acts as an IPFS node using Libp2p, ensuring true decentralized loading and caching of IPFS content.

## Features

- **In-browser IPFS Browser**: Allows users to browse IPFS content directly from the browser.
- **Decentralized Website Loader**: Loads websites from IPFS and IPNS directly in the browser.
- **Service Worker**: Implements a service worker that functions as an IPFS node to load and cache IPFS content in a decentralized manner.

## TODO

- Implement a promise for `cacheIpfsStr` in the service worker to handle multiple calls efficiently.
- Add caching for IPNS records.
- Cache peers for faster bootstrap.
- Introduce a favorite websites menu.
- Add a popular websites menu, focusing on decentralized websites.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

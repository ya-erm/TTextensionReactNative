module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          alias: {
            '/api': './api',
            '/components': './components',
            '/constants': './constants',
            '/hooks': './hooks',
            '/screens': './screens',
          },
        },
      ],
    ],
  };
};

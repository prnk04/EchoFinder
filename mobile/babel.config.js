module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // 👈 This already includes @babel/preset-react
    plugins: [
      [
        'dotenv-import',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};

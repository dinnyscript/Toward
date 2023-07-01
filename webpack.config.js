const path = require('path');

module.exports = {
  entry: './src/r.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    'Editor' : 'Editor',
    'Node' : 'Node',
    'StarterKit' : 'StarterKit'
  },
  optimization: {
    minimize: false,
  }
};
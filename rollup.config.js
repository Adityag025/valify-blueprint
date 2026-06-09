import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const input = 'src/index.js'
const terserOptions = {
  compress: { passes: 2, drop_console: false },
  format: { comments: false },
}

export default [
  {
    input,
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [resolve(), terser(terserOptions)],
  },
  {
    input,
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [resolve(), terser(terserOptions)],
  },
]

import resolve from '@rollup/plugin-node-resolve'

const input = 'src/index.js'

export default [
  {
    input,
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [resolve()],
  },
  {
    input,
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [resolve()],
  },
]

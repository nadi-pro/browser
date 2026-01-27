import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nadi.umd.js',
      format: 'umd',
      name: 'Nadi',
      sourcemap: true,
      exports: 'named',
      // Make Nadi class available directly as window.Nadi
      footer: `
        if (typeof window !== 'undefined') {
          window.Nadi = window.Nadi.Nadi || window.Nadi.default || window.Nadi;
        }
      `,
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      production && terser(),
    ],
  },
  // ESM build for bundlers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nadi.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      production && terser(),
    ],
    external: ['web-vitals'],
  },
  // CJS build for Node
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nadi.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      production && terser(),
    ],
    external: ['web-vitals'],
  },
];

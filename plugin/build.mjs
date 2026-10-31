// Build client.js from src fragments. Run: node build.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const readDir = (dir) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith('.js'))
    .sort()
    .map((f) => readFileSync(join(root, dir, f), 'utf8').trimEnd())

const header = `window.__ModuleLoader__.load({
  id: '@local/physics-lab-sprint',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useMemo, useRef, useCallback } = React;
`

const footer = `
    return {
      inject: ['slots'],
      apply(ctx) {
        appCtx = ctx;
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'physics-lab',
        }, PhysicsLabApp));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'physics-lab',
          order: 20,
          label: '物理冲刺',
        }, PhysicsLabIcon));
      },
    };
  },
});
`

const body = [...readDir('src/bank'), ...readDir('src/ui')].join('\n\n')
writeFileSync(join(root, 'client.js'), header + body + footer)
console.log('client.js written:', (header + body + footer).length, 'chars')

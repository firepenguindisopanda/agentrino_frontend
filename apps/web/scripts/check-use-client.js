#!/usr/bin/env node
/* eslint-disable no-console */
// Simple check for client components that use React hooks or browser globals but lack "use client" directive
const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, filelist);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      filelist.push(full);
    }
  });
  return filelist;
}

const root = path.join(__dirname, '..', 'src', 'components');
if (!fs.existsSync(root)) {
  console.error('Components folder not found at', root);
  process.exit(0);
}

const files = walk(root);
const HOOKS = ['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext', 'useLayoutEffect', 'useReducer'];
const WARNERS = ['window', 'document', 'localStorage', 'sessionStorage', 'location', 'navigator'];

let problems = 0;

files.forEach((file) => {
  const rel = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, 'utf8');
  const firstLines = content.split('\n').slice(0, 6).join('\n');
  const hasUseClient = /(^|\n)\s*['"]use client['"]\s*;?/m.test(firstLines);

  const usesHook = HOOKS.some((h) => new RegExp("\\b" + h + "\\b").test(content));
  const usesBrowser = WARNERS.some((w) => new RegExp("\\b" + w + "\\b").test(content));

  if ((usesHook || usesBrowser) && !hasUseClient) {
    problems += 1;
    console.warn(`⚠️  ${rel} appears to be a client component but is missing "use client"`);
    const foundHooks = HOOKS.filter((h) => new RegExp("\\b" + h + "\\b").test(content)).join(', ');
    const foundWarners = WARNERS.filter((w) => new RegExp("\\b" + w + "\\b").test(content)).join(', ');
    console.log(`   -> Hooks: ${foundHooks || '-'}; Browser globals: ${foundWarners || '-'}`);
  }
});

if (problems > 0) {
  console.error(`\nFound ${problems} files missing "use client". Please add the directive to the top of those files.`);
  process.exit(1);
} else {
  console.log('✅ No missing "use client" directives detected in components.');
  process.exit(0);
}

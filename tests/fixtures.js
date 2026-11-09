import { readFileSync } from 'node:fs';
export const demos = JSON.parse(readFileSync(new URL('./fixtures/demo-resources.json', import.meta.url)));
// Browser routes inject these synthetic records in memory. They are never written to the public data file.
export const published = demos.map((item, index) => ({ ...item, demo: false, title: item.title.replace('DEMO ', '测试专用 '), status: 'published', url: `https://example.invalid/test-${index}` }));

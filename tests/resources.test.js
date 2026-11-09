import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeResources, filterResources, safeUrl } from '../js/resources.js';
import { demos, published } from './fixtures.js';

test('only published, safe, unique non-demo records are public', () => {
  assert.equal(normalizeResources([...demos, ...published, published[0], null, {}, { ...published[0], id:'bad', url:'javascript:alert(1)' }]).length, 4);
  assert.equal(normalizeResources([{ ...published[0], demo:true }, { ...published[0], title:'DEMO 资料' }]).length, 0);
});
test('HTTP(S) only, no relative or credential-bearing links', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,test', '//example.com', '/local', 'https://', 'https://user:pass@example.com', null, 42]) assert.equal(safeUrl(value), '');
  assert.equal(safeUrl(' https://example.com/test '), 'https://example.com/test');
  assert.equal(safeUrl('http://example.com'), 'http://example.com/');
});
test('combined filters, multiple grades, Chinese search and zero results', () => {
  const rows = normalizeResources(published);
  assert.equal(filterResources(rows, { grade:'2025' }).length, 2);
  assert.equal(filterResources(rows, { grade:'2024', course:'民法' }).length, 1);
  assert.equal(filterResources(rows, { grade:'2025', course:'民法', teacher:'示例教师乙', type:'exam-recall', classType:'实验班', query:' 债法 ' }).length, 1);
  assert.equal(filterResources(rows, { grade:'2024', course:'法理学' }).length, 0);
  assert.equal(filterResources(rows, { query:'示例教师丙' }).length, 1);
});
test('missing fields do not crash and malformed root triggers failure', () => {
  const rows = normalizeResources([{id:'minimal',title:'最少字段',url:'https://example.invalid',status:'published'}, { ...published[0], id:'odd', grades:[null, 2025, {}, '2024'], teacher:42, type:'toString' }]);
  assert.equal(rows[0].author, '匿名'); assert.equal(rows[0].classType,'未知');
  assert.deepEqual(rows[1].grades,['2024']); assert.equal(rows[1].type,'other');
  assert.equal(filterResources(rows, { query:'最少' }).length, 1);
  assert.throws(() => normalizeResources({}));
});

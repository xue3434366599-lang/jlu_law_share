import { PROJECT_EMAIL } from './config.js';
import { TYPE_LABELS, normalizeResources, filterResources } from './resources.js';

const $ = id => document.getElementById(id);
const controls = Object.fromEntries(['grade', 'course', 'teacher', 'type', 'classType'].map(id => [id, $(id)]));
let resources = [], loadState = 'loading';
const emailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(PROJECT_EMAIL);
const mailto = (subject, body = '') => `mailto:${PROJECT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
function node(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}
function options(select, values, label) {
  const previous = select.value;
  select.replaceChildren(new Option(label, ''), ...[...new Set(values)].sort((a,b) => a.localeCompare(b, 'zh-CN', { numeric: true })).map(value => new Option(select.id === 'grade' ? `${value}级` : value, value)));
  if ([...select.options].some(option => option.value === previous)) select.value = previous;
}
function syncCascade() {
  options(controls.grade, resources.flatMap(item => item.grades), '全部年级');
  const byGrade = filterResources(resources, { grade: controls.grade.value });
  options(controls.course, byGrade.map(item => item.course), '全部课程');
  options(controls.teacher, filterResources(byGrade, { course: controls.course.value }).map(item => item.teacher), '全部教师');
}
function state(title, description, actionText, action) {
  const box = node('div', 'state');
  const icon = node('div', 'state-icon');
  // Static, developer-owned SVG only. Resource data is always rendered as text.
  icon.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h6l2 2h8v13H4z"/><path d="M8 12h8M8 16h5"/></svg>';
  box.append(icon, node('h3', '', title), node('p', '', description));
  if (actionText) {
    const button = node('button', 'button', actionText);
    button.type = 'button'; button.addEventListener('click', action); box.append(button);
  }
  $('results').replaceChildren(box);
}
function card(item) {
  const article = node('article', 'resource-card');
  article.append(node('p', 'card-type', TYPE_LABELS[item.type]), node('h3', '', item.title));
  const meta = node('dl', 'card-meta');
  [['课程', item.course], ['年级', item.grades.length ? item.grades.map(grade => `${grade}级`).join('、') : '未注明'], ['教师', item.teacher], ['班型', item.classType], ['学期', item.semester]].forEach(([label, value]) => {
    const row = node('div'); row.append(node('dt', '', label), node('dd', '', value)); meta.append(row);
  });
  article.append(meta, node('p', 'card-description', item.description || '暂无补充说明'));
  if (item.type === 'exam-recall') article.append(node('p', 'recall-note', `核实情况：${item.verification}。非官方试题，内容可能存在遗漏或表述偏差。`));
  const footer = node('div', 'card-footer');
  const link = node('a', 'button', '免费获取 ↗');
  link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', `免费获取：${item.title}（在新标签页打开）`);
  footer.append(node('small', '', `贡献者：${item.author}`), link); article.append(footer);
  return article;
}
function render() {
  if (loadState !== 'ready') return;
  const filters = Object.fromEntries(Object.entries(controls).map(([key, input]) => [key, input.value]));
  const matches = filterResources(resources, { ...filters, query: $('search').value });
  $('result-count').textContent = `共 ${matches.length} 份资料`;
  if (!resources.length) return state('资料库正在建设中，欢迎投稿第一批资料。', '每一份经过确认的分享，都会在这里被更多同学看见。', '投稿资料 ↗', () => { location.hash = 'contribute'; });
  if (!matches.length) return state('暂时没有找到匹配的资料', '试试其他关键词，或重置筛选条件。', '重置筛选', reset);
  const grid = node('div', 'card-grid'); grid.append(...matches.map(card)); $('results').replaceChildren(grid);
}
function reset() { Object.values(controls).forEach(control => { control.value = ''; }); $('search').value = ''; syncCascade(); render(); }
async function load() {
  loadState = 'loading'; $('results').setAttribute('aria-busy', 'true'); $('result-count').textContent = '正在加载资料…';
  state('正在加载资料', '请稍候…');
  try {
    const response = await fetch('./data/resources.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('加载失败');
    resources = normalizeResources(await response.json()); loadState = 'ready'; syncCascade(); render();
  } catch {
    loadState = 'error'; $('result-count').textContent = '资料暂时无法加载';
    state('资料加载失败', '请检查网络后重试；也可通过项目邮箱反馈。', '重新加载', load);
  } finally { $('results').setAttribute('aria-busy', 'false'); }
}
$('filters').addEventListener('submit', event => event.preventDefault());
Object.values(controls).forEach(select => select.addEventListener('change', () => { syncCascade(); render(); }));
$('search').addEventListener('input', render);
$('search-form').addEventListener('submit', event => { event.preventDefault(); render(); $('library').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
$('reset').addEventListener('click', reset);
$('project-email').textContent = emailReady ? PROJECT_EMAIL : 'PROJECT_EMAIL（上线前待配置）';
if (emailReady) {
  $('copy-email').disabled = false;
  $('submit-email').href = mailto('【资料投稿】年级-课程-教师-资料类型', '年级：\n课程：\n授课教师：\n班型：\n资料类型：\n学年学期：\n资料说明：\n署名方式：匿名/自定义署名\n是否允许平台免费公开分享：\n资料来源及分享权限说明：\n\n请自行添加附件。');
  $('feedback-email').href = mailto('【版权或资料纠错反馈】资料名称', '涉及资料名称或链接：\n问题说明：\n申请更正或下架的理由：\n');
  ['submit-email', 'feedback-email'].forEach(id => $(id).removeAttribute('aria-disabled'));
}
$('copy-email').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(PROJECT_EMAIL); $('copy-status').textContent = '邮箱已复制'; }
  catch { $('copy-status').textContent = `无法自动复制，请选中邮箱地址手动复制：${PROJECT_EMAIL}`; }
});
load();

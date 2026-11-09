export const TYPE_LABELS = { ppt: '课程PPT', 'exam-recall': '期末试题回忆版', other: '其他' };
const text = value => typeof value === 'string' ? value.trim() : '';

export function safeUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) return '';
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && url.hostname && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function normalizeResources(data) {
  if (!Array.isArray(data)) throw new Error('资料目录格式错误');
  const ids = new Set();
  return data.flatMap(item => {
    if (!item || typeof item !== 'object' || item.status !== 'published' || item.demo === true) return [];
    const id = text(item.id), title = text(item.title), url = safeUrl(item.url);
    if (!id || !title || !url || ids.has(id) || /\bDEMO\b/i.test(title)) return [];
    ids.add(id);
    return [{ id, title, url, grades: Array.isArray(item.grades) ? [...new Set(item.grades.map(text).filter(Boolean))] : [],
      course: text(item.course) || '未注明课程', teacher: text(item.teacher) || '未注明教师',
      classType: ['普通班', '实验班', '通用', '未知'].includes(item.classType) ? item.classType : '未知',
      type: Object.hasOwn(TYPE_LABELS, item.type) ? item.type : 'other', semester: text(item.semester) || '未注明',
      verification: text(item.verification) || '未注明核实情况', description: text(item.description), author: text(item.author) || '匿名' }];
  });
}

export function filterResources(resources, filters = {}) {
  const query = (filters.query || '').trim().toLocaleLowerCase();
  return resources.filter(item => (!filters.grade || item.grades.includes(filters.grade)) &&
    (!filters.course || item.course === filters.course) && (!filters.teacher || item.teacher === filters.teacher) &&
    (!filters.type || item.type === filters.type) && (!filters.classType || item.classType === filters.classType) &&
    (!query || [item.title, item.course, item.teacher, item.description].some(value => value.toLocaleLowerCase().includes(query))));
}

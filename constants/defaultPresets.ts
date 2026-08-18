import { CopyGroup, FieldConfig, MediaPreset, PromptSection } from '../types';

export const DEFAULT_EXTRACTION_GROUPS: CopyGroup[] = [
  { id: 0, label: '基本情報', order: 0 },
  { id: 1, label: '求人タイトル', order: 1 },
  { id: 2, label: '仕事内容・魅力', order: 2 },
  { id: 3, label: '条件・待遇', order: 3 },
  { id: 4, label: '応募資格', order: 4 },
];

export const DEFAULT_EXTRACTION_FIELDS: FieldConfig[] = [
  { id: 'companyName', label: '企業名', description: '企業名', type: 'string', group: 0, order: 0, isEnabled: true },
  { id: 'workLocation', label: '勤務地', description: '勤務地', type: 'string', group: 0, order: 1, isEnabled: true },
  { id: 'remoteWork', label: 'リモートワークの可否', description: 'リモートワークの可否（例：可、不可、一部可など）', type: 'string', group: 0, order: 2, isEnabled: true },
  { id: 'passiveSmoking', label: '受動喫煙対策の有無', description: '受動喫煙対策の有無', type: 'string', group: 0, order: 3, isEnabled: true },
  { id: 'companySize', label: '会社規模（社員数）', description: '会社規模（社員数など）', type: 'string', group: 0, order: 4, isEnabled: true },
  { id: 'departmentAndTitle', label: '部署・役職名（おすすめ候補3選）', description: '部署・役職名。候補者に魅力的に見えるよう仕事内容や仕事の魅力と絡めたキャッチーな表記で【必ずおすすめ候補を3つ】作成し、箇条書き（行頭「・」）で出力してください。※企業名やサービス名は絶対に記載しないでください。', type: 'string', group: 1, order: 5, isEnabled: true },
  { id: 'jobDescription', label: '仕事内容', description: '仕事内容。必ず【仕事内容】、【仕事の魅力】、【キャリア上の魅力】の3つのセクションを立て、各セクションの間には必ず1行の空行（改行）を挿入してください。セクション内は箇条書き（行頭に「・」を使用）で具体的に記述してください。', type: 'string', group: 2, order: 6, isEnabled: true },
  { id: 'jobCategory', label: '職種（スカウト媒体カテゴリー・3選）', description: '職種。スカウト媒体（スカウトサービス等）の選択項目となるカテゴリーから、求人内容に最も即したおすすめの職種を必ず3つ選び、箇条書き（行頭に「・」）で具体的に記述してください。', type: 'string', group: 2, order: 7, isEnabled: true },
  { id: 'industry', label: '業種（スカウト媒体カテゴリー・2選）', description: '業種。スカウト媒体（スカウトサービス等）の選択項目となるカテゴリーから、企業・求人情報に最も即したおすすめの業種・業界を必ず2つ選び、箇条書き（行頭に「・」）で具体的に記述してください。', type: 'string', group: 2, order: 8, isEnabled: true },
  { id: 'workingConditions', label: '労働条件', description: '労働条件に関する情報（勤務時間、休日休暇、福利厚生など）。箇条書きで見やすく整理してください。', type: 'string', group: 3, order: 9, isEnabled: true },
  { id: 'salaryRange', label: '給与レンジ', description: '給与レンジ', type: 'string', group: 3, order: 10, isEnabled: true },
  { id: 'companyOverviewAndBenefits', label: '会社概要及び福利厚生', description: '会社概要及び福利厚生（企業の特徴やビジョン、独自の制度、福利厚生などの魅力）', type: 'string', group: 3, order: 11, isEnabled: true },
  { id: 'requiredQualifications', label: '応募資格（必須）', description: '応募資格（必須）', type: 'string', group: 4, order: 12, isEnabled: true },
  { id: 'preferredQualifications', label: '応募資格（歓迎）', description: '応募資格（歓迎）', type: 'string', group: 4, order: 13, isEnabled: true },
];

export const DEFAULT_SCOUT_GROUPS: CopyGroup[] = [
  { id: 0, label: '本文全体', order: 0 },
];

export const DEFAULT_SCOUT_SECTIONS: PromptSection[] = [
  { id: '1', title: '◤ご連絡の背景◢', instruction: '{ここに連絡の背景を記述}', enabled: true, group: 0, order: 0 },
  { id: '2', title: '◤企業・仕事の魅力◢', instruction: '{ここに企業・仕事の魅力を記述}', enabled: true, group: 0, order: 1 },
  { id: '3', title: '◤将来描けるキャリアパス◢', instruction: '❶社内でのキャリアアップ・年収推移\n{ここに将来のキャリアパス①を記述}\n\n❷同職種でのキャリアパス・年収推移\n{ここに将来のキャリアパス②を記述}\n\n❸異なる職種・ポジションへのキャリアパス\n{ここに将来のキャリアパス③を記述}', enabled: true, group: 0, order: 2 },
  { id: '4', title: '◤福利厚生◢', instruction: '{ここに福利厚生情報を記述}', enabled: true, group: 0, order: 3 },
];

export const buildDefaultPreset = (id: string, name: string): MediaPreset => {
  const now = new Date().toISOString();
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    extraction: {
      fields: DEFAULT_EXTRACTION_FIELDS.map(f => ({ ...f })),
      groups: DEFAULT_EXTRACTION_GROUPS.map(g => ({ ...g })),
    },
    scout: {
      promptSections: DEFAULT_SCOUT_SECTIONS.map(s => ({ ...s })),
      groups: DEFAULT_SCOUT_GROUPS.map(g => ({ ...g })),
      fixedPhrases: [],
      knowledge: { subjects: [], structures: [] },
    },
  };
};

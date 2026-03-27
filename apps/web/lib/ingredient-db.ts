/**
 * 검증된 스킨케어 성분 데이터베이스
 * - 트렌드 성분: API 호출 없이 즉시 표시 (비용 0, 속도 즉시)
 * - 분석 시: AI 프롬프트에 주입하여 Haiku 정확도 향상
 */

export interface IngredientInfo {
  name: string
  nameEn: string
  action: string
  timing: string
  cautionCombos: string[]
  synergy: string[]
  tips: string[]
  effectTimeline: string
  rating: number
  bestFor: string
}

export const INGREDIENT_DB: Record<string, IngredientInfo> = {
  // ── 트렌드 성분 (8개) ──
  pdrn: {
    name: "PDRN",
    nameEn: "Polydeoxyribonucleotide",
    action: "A2A 아데노신 수용체에 결합하여 세포 재생 촉진, 콜라겐 합성 증가, 항염 효과를 냅니다.",
    timing: "아침/저녁 모두 가능. 광과민성 없어서 아침에도 SPF 병행하면 문제없습니다.",
    cautionCombos: [],
    synergy: ["비타민C (색소침착 감소 시너지)", "나이아신아마이드 (피부 장벽 + 재생 시너지)", "히알루론산 (수분 + 재생 동시)"],
    tips: ["시술 후 진정 목적으로도 효과적이에요.", "꾸준히 4주 이상 사용해야 재생 효과를 체감할 수 있어요."],
    effectTimeline: "즉각적인 수분감, 재생 효과는 4~8주 사용 후 체감",
    rating: 4,
    bestFor: "노화, 시술 후 회복, 칙칙한 피부, 전 피부 타입",
  },
  retinol: {
    name: "레티놀",
    nameEn: "Retinol",
    action: "세포 턴오버를 촉진하고, 콜라겐 합성을 자극하여 주름 개선과 피부결 정돈에 효과적입니다.",
    timing: "저녁 전용. 자외선에 분해되어 효과가 감소하고, 광과민성을 높일 수 있습니다.",
    cautionCombos: ["AHA/BHA (자극 중첩, 분리 사용 권장)", "벤조일퍼옥사이드 (레티놀을 산화시킴)"],
    synergy: ["나이아신아마이드 (자극 완화 + 톤업 시너지)", "히알루론산 (건조함 보완)", "세라마이드 (장벽 보호)"],
    tips: ["처음엔 주 2-3회부터 시작해서 서서히 매일로 늘리세요.", "바른 후 반드시 다음날 아침 SPF를 꼼꼼히 바르세요."],
    effectTimeline: "피부결 개선 2~4주, 주름 개선 8~12주",
    rating: 5,
    bestFor: "노화, 주름, 모공, 피부결, 중성~지성 피부",
  },
  centella: {
    name: "센텔라",
    nameEn: "Centella Asiatica",
    action: "마데카소사이드, 아시아티코사이드 등 활성 성분이 손상된 피부를 진정시키고 장벽을 강화합니다.",
    timing: "아침/저녁 모두 가능. 자극 없는 성분이라 언제든 사용 가능합니다.",
    cautionCombos: [],
    synergy: ["나이아신아마이드 (진정 + 톤업)", "히알루론산 (진정 + 수분)", "판테놀 (진정 시너지)"],
    tips: ["트러블이 있을 때 집중적으로 사용하면 진정이 빨라요.", "민감성 피부의 기본 진정 성분으로 꾸준히 쓰면 좋아요."],
    effectTimeline: "진정 효과 1~3일, 장벽 강화 2~4주",
    rating: 5,
    bestFor: "민감성, 트러블, 홍조, 장벽 손상, 전 피부 타입",
  },
  vitamin_c: {
    name: "비타민C",
    nameEn: "Ascorbic Acid",
    action: "강력한 항산화제로 멜라닌 생성을 억제하고, 콜라겐 합성을 촉진하여 톤업과 탄력 개선에 효과적입니다.",
    timing: "아침 사용 권장. 자외선으로부터 피부를 보호하는 항산화 역할을 합니다. SPF와 함께 사용하세요.",
    cautionCombos: ["AHA/BHA (고농도 조합 시 자극 가능, 민감하면 시간 간격 두기)"],
    synergy: ["비타민E (항산화 시너지, 서로의 효과를 재생시킴)", "페룰산 (안정성 + 효과 증가)", "PDRN (색소침착 감소 시너지)"],
    tips: ["L-아스코르빅산 형태가 가장 효과적이지만 자극도 있어서, 민감하면 유도체(SAP, MAP) 사용하세요.", "개봉 후 3개월 내 사용하고, 갈변되면 효과가 떨어져요."],
    effectTimeline: "톤업 2~4주, 색소침착 개선 6~8주",
    rating: 5,
    bestFor: "칙칙한 피부, 색소침착, 노화 방지, 전 피부 타입",
  },
  niacinamide: {
    name: "나이아신아마이드",
    nameEn: "Niacinamide",
    action: "멜라닌 전달을 억제하여 톤을 밝히고, 세라마이드 합성을 촉진하여 피부 장벽을 강화합니다. 피지 조절 효과도 있습니다.",
    timing: "아침/저녁 모두 가능. 자극이 거의 없는 안정적인 성분입니다.",
    cautionCombos: [],
    synergy: ["레티놀 (자극 완화 + 톤업)", "비타민C (톤업 시너지 — 함께 써도 안전)", "히알루론산 (수분 + 장벽)"],
    tips: ["2~5% 농도면 대부분의 피부에 충분해요.", "비타민C와 같이 사용해도 문제없어요."],
    effectTimeline: "피지 조절 1~2주, 톤업 4~8주",
    rating: 5,
    bestFor: "모공, 피지, 칙칙한 피부, 장벽 손상, 전 피부 타입",
  },
  ceramide: {
    name: "세라마이드",
    nameEn: "Ceramide",
    action: "피부 장벽의 핵심 구성 성분으로, 수분 손실을 막고 외부 자극으로부터 피부를 보호합니다.",
    timing: "아침/저녁 모두 가능. 특히 세안 후 장벽이 약해진 상태에서 효과적입니다.",
    cautionCombos: [],
    synergy: ["콜레스테롤 + 지방산 (장벽 회복 골든 비율)", "히알루론산 (수분 보충 + 장벽 보호)", "판테놀 (진정 + 장벽 강화)"],
    tips: ["장벽이 무너졌을 때 세라마이드, 콜레스테롤, 지방산 3:1:1 비율이 가장 효과적이에요.", "건조한 계절에 꾸준히 사용하면 피부가 확실히 달라져요."],
    effectTimeline: "즉각적인 보습감, 장벽 회복 2~4주",
    rating: 5,
    bestFor: "건조, 민감성, 장벽 손상, 아토피, 전 피부 타입",
  },
  hyaluronic: {
    name: "히알루론산",
    nameEn: "Hyaluronic Acid",
    action: "자기 무게의 1000배 수분을 끌어당겨 피부에 수분을 공급하고 유지시킵니다.",
    timing: "아침/저녁 모두 가능. 세안 직후 물기가 남아있을 때 바르면 효과가 극대화됩니다.",
    cautionCombos: [],
    synergy: ["세라마이드 (수분 공급 + 장벽 보호)", "나이아신아마이드 (수분 + 톤업)", "비타민C (수분 + 항산화)"],
    tips: ["습한 환경에서 효과가 더 좋아요. 건조한 환경에선 위에 크림을 꼭 덮어주세요.", "저분자 + 고분자 히알루론산이 같이 들어있는 제품이 가장 효과적이에요."],
    effectTimeline: "즉각적인 수분감, 꾸준한 사용 시 2~4주 후 피부결 개선",
    rating: 5,
    bestFor: "건조, 탈수, 주름, 전 피부 타입",
  },
  peptide: {
    name: "펩타이드",
    nameEn: "Peptides",
    action: "콜라겐 합성을 촉진하는 신호를 보내 피부 탄력을 개선합니다. 종류에 따라 주름 완화, 진정, 색소 조절 등 다양한 효과가 있습니다.",
    timing: "아침/저녁 모두 가능. 자극이 거의 없는 안전한 성분입니다.",
    cautionCombos: ["직접적인 산(AHA/BHA 고농도) — 산성 환경에서 펩타이드가 분해될 수 있어 시간 간격을 두세요"],
    synergy: ["나이아신아마이드 (탄력 + 장벽)", "히알루론산 (수분 + 탄력)", "비타민C (콜라겐 합성 시너지)"],
    tips: ["구리펩타이드(GHK-Cu)는 레티놀과 같은 저녁에 사용하면 재생 시너지가 있어요.", "아르지렐린(헥사펩타이드)은 표정 주름에 특히 효과적이에요."],
    effectTimeline: "탄력 개선 4~8주, 주름 개선 8~12주",
    rating: 4,
    bestFor: "노화, 주름, 탄력 저하, 전 피부 타입",
  },

  // ── 주요 성분 (20+개) ──
  panthenol: {
    name: "판테놀",
    nameEn: "Panthenol (Pro-Vitamin B5)",
    action: "피부 속에서 비타민B5로 전환되어 수분을 끌어당기고, 피부 재생과 진정을 돕습니다.",
    timing: "아침/저녁 모두 가능.",
    cautionCombos: [],
    synergy: ["센텔라 (진정 시너지)", "히알루론산 (수분 시너지)", "세라마이드 (장벽 강화)"],
    tips: ["5% 이상 농도에서 상처 치유 효과가 뚜렷해요.", "거의 자극이 없어서 민감성 피부의 필수 성분이에요."],
    effectTimeline: "진정 1~2일, 보습 즉각",
    rating: 5,
    bestFor: "민감성, 건조, 트러블 후 진정, 전 피부 타입",
  },
  aha: {
    name: "AHA (글리콜산/락틱산)",
    nameEn: "Alpha Hydroxy Acid",
    action: "각질 세포 간 결합을 녹여 각질을 제거하고, 피부 턴오버를 촉진합니다.",
    timing: "저녁 사용 권장. 광과민성을 높이므로 다음날 SPF 필수입니다.",
    cautionCombos: ["레티놀 (자극 중첩, 같은 날 사용 자제)", "고농도 비타민C (자극 중첩 가능)"],
    synergy: ["나이아신아마이드 (각질 제거 후 톤업)", "히알루론산 (각질 제거 후 수분 보충)"],
    tips: ["처음엔 5~8% 저농도부터 시작하세요.", "주 2~3회부터 시작해서 피부 반응 보고 늘려가세요."],
    effectTimeline: "각질 제거 즉각, 피부결 개선 2~4주",
    rating: 4,
    bestFor: "각질, 칙칙한 피부, 모공, 중성~지성 피부",
  },
  bha: {
    name: "BHA (살리실산)",
    nameEn: "Beta Hydroxy Acid (Salicylic Acid)",
    action: "지용성이라 모공 속까지 침투하여 피지와 각질을 녹이고, 항염 효과도 있습니다.",
    timing: "저녁 사용 권장. 아침에 쓸 경우 SPF 필수.",
    cautionCombos: ["레티놀 (자극 중첩, 분리 사용 권장)"],
    synergy: ["나이아신아마이드 (피지 조절 시너지)", "센텔라 (진정 + 각질 관리)"],
    tips: ["2% 농도가 일반적이에요. 매일 쓰기보다 주 2~3회 추천합니다.", "블랙헤드, 화이트헤드에 특히 효과적이에요."],
    effectTimeline: "피지 조절 1~2주, 모공 개선 4~6주",
    rating: 4,
    bestFor: "여드름, 블랙헤드, 모공, 지성 피부",
  },
  adenosine: {
    name: "아데노신",
    nameEn: "Adenosine",
    action: "콜라겐 합성을 촉진하고 주름을 개선하는 기능성 고시 성분입니다.",
    timing: "아침/저녁 모두 가능. 자극 없음.",
    cautionCombos: [],
    synergy: ["레티놀 (주름 개선 시너지)", "펩타이드 (탄력 시너지)"],
    tips: ["한국 식약처 주름 개선 기능성 인정 성분이에요.", "거의 모든 피부 타입에 안전해요."],
    effectTimeline: "주름 개선 4~8주",
    rating: 4,
    bestFor: "노화, 주름, 전 피부 타입",
  },
  allantoin: {
    name: "알란토인",
    nameEn: "Allantoin",
    action: "피부 진정과 보습, 각질 연화 효과가 있으며 자극이 매우 낮습니다.",
    timing: "아침/저녁 모두 가능.",
    cautionCombos: [],
    synergy: ["판테놀 (진정 시너지)", "센텔라 (진정 강화)"],
    tips: ["자극이 거의 없어서 아기 제품에도 많이 들어가요.", "트러블 진정 제품의 기본 성분이에요."],
    effectTimeline: "진정 즉각, 각질 연화 1~2주",
    rating: 4,
    bestFor: "민감성, 트러블, 건조, 전 피부 타입",
  },
  squalane: {
    name: "스쿠알란",
    nameEn: "Squalane",
    action: "피부 피지와 유사한 구조로 흡수가 빠르고, 수분 증발을 막아 보습을 유지합니다.",
    timing: "아침/저녁 모두 가능. 마지막 단계에서 수분을 가두는 용도로 사용하세요.",
    cautionCombos: [],
    synergy: ["히알루론산 (수분 공급 후 가두기)", "세라마이드 (장벽 강화)"],
    tips: ["가벼운 오일이라 지성 피부도 부담 없이 쓸 수 있어요.", "식물성 스쿠알란이 산화에 더 안정적이에요."],
    effectTimeline: "즉각적인 보습, 장벽 개선 2~4주",
    rating: 4,
    bestFor: "건조, 민감성, 전 피부 타입",
  },
  "zinc-oxide": {
    name: "징크옥사이드",
    nameEn: "Zinc Oxide",
    action: "물리적 자외선 차단제로 UVA/UVB를 반사하여 차단합니다. 항염 효과도 있습니다.",
    timing: "아침 사용. 자외선 차단 목적.",
    cautionCombos: [],
    synergy: ["비타민C (자외선 방어 + 항산화)", "나이아신아마이드 (피부 보호 시너지)"],
    tips: ["민감성 피부에도 자극이 적은 자외선 차단 성분이에요.", "백탁 현상이 있을 수 있어요."],
    effectTimeline: "즉각적인 자외선 차단",
    rating: 4,
    bestFor: "자외선 차단, 민감성 피부, 전 피부 타입",
  },
  glycerin: {
    name: "글리세린",
    nameEn: "Glycerin",
    action: "수분을 끌어당기는 습윤제로, 피부 보습과 장벽 기능을 지원합니다.",
    timing: "아침/저녁 모두 가능.",
    cautionCombos: [],
    synergy: ["히알루론산 (수분 시너지)", "세라마이드 (장벽 + 보습)"],
    tips: ["거의 모든 스킨케어 제품에 기본으로 들어가는 안전한 보습 성분이에요.", "5% 이상 농도에서 보습 효과가 뚜렷합니다."],
    effectTimeline: "즉각적인 보습",
    rating: 4,
    bestFor: "건조, 전 피부 타입",
  },
  "tea-tree": {
    name: "티트리",
    nameEn: "Tea Tree Oil",
    action: "테르피넨-4-올 성분이 항균, 항염 작용을 하여 트러블 진정에 효과적입니다.",
    timing: "저녁 사용 권장. 낮에 사용 시 광과민성 가능.",
    cautionCombos: ["레티놀 (자극 중첩 가능, 민감하면 분리 사용)"],
    synergy: ["센텔라 (진정 시너지)", "나이아신아마이드 (트러블 + 피지 조절)"],
    tips: ["5% 농도가 여드름 개선에 가장 많이 연구된 농도예요.", "원액은 반드시 희석해서 사용하세요."],
    effectTimeline: "트러블 진정 3~7일, 여드름 개선 4~6주",
    rating: 4,
    bestFor: "여드름, 트러블, 지성 피부",
  },
  arbutin: {
    name: "알부틴",
    nameEn: "Arbutin",
    action: "티로시나아제 활성을 억제하여 멜라닌 생성을 줄이고, 기미/색소침착을 개선합니다.",
    timing: "아침/저녁 모두 가능.",
    cautionCombos: [],
    synergy: ["비타민C (미백 시너지)", "나이아신아마이드 (톤업 시너지)"],
    tips: ["알파알부틴이 베타알부틴보다 효과가 더 강해요.", "꾸준히 8주 이상 사용해야 효과를 볼 수 있어요."],
    effectTimeline: "톤업 4~8주, 색소 개선 8~12주",
    rating: 4,
    bestFor: "색소침착, 기미, 칙칙한 피부",
  },
  tocopherol: {
    name: "토코페롤 (비타민E)",
    nameEn: "Tocopherol (Vitamin E)",
    action: "항산화제로 자유라디칼을 중화하고, 피부 장벽을 보호하며 보습 효과가 있습니다.",
    timing: "아침/저녁 모두 가능. 아침에 비타민C와 함께 쓰면 항산화 시너지.",
    cautionCombos: [],
    synergy: ["비타민C (항산화 시너지, 서로를 재생시킴)", "페룰산 (항산화 트리오)"],
    tips: ["비타민C + E + 페룰산 조합이 가장 강력한 항산화 시너지예요.", "단독으로도 보습과 장벽 보호에 좋아요."],
    effectTimeline: "항산화 보호 즉각, 보습 즉각",
    rating: 4,
    bestFor: "노화 방지, 건조, 전 피부 타입",
  },
  "beta-glucan": {
    name: "베타글루칸",
    nameEn: "Beta-Glucan",
    action: "면역 세포를 활성화하고, 피부 진정과 보습에 뛰어난 효과가 있습니다.",
    timing: "아침/저녁 모두 가능.",
    cautionCombos: [],
    synergy: ["히알루론산 (보습 시너지)", "센텔라 (진정 시너지)"],
    tips: ["히알루론산보다 보습 지속력이 더 좋다는 연구도 있어요.", "민감성 피부에 자극 없이 사용 가능해요."],
    effectTimeline: "보습 즉각, 진정 1~3일",
    rating: 4,
    bestFor: "민감성, 건조, 진정, 전 피부 타입",
  },
  madecassoside: {
    name: "마데카소사이드",
    nameEn: "Madecassoside",
    action: "센텔라의 핵심 활성 성분으로, 항염과 콜라겐 합성 촉진 효과가 있습니다.",
    timing: "아침/저녁 모두 가능.",
    cautionCombos: [],
    synergy: ["판테놀 (진정 시너지)", "나이아신아마이드 (진정 + 톤업)"],
    tips: ["센텔라 추출물보다 순수 마데카소사이드가 더 효과적이에요.", "시카 크림의 핵심 성분이에요."],
    effectTimeline: "진정 1~3일, 장벽 개선 2~4주",
    rating: 5,
    bestFor: "민감성, 트러블, 홍조, 장벽 손상",
  },
  "ferulic-acid": {
    name: "페룰산",
    nameEn: "Ferulic Acid",
    action: "항산화제로, 비타민C와 E의 안정성과 효과를 2배 이상 높여줍니다.",
    timing: "아침 사용 권장. 자외선 방어 시너지.",
    cautionCombos: [],
    synergy: ["비타민C + 비타민E (항산화 트리오)", "나이아신아마이드"],
    tips: ["단독보다 비타민C, E와 함께 쓸 때 진가를 발휘해요.", "CEF 세럼을 찾으면 이 조합이 다 들어있어요."],
    effectTimeline: "항산화 보호 즉각",
    rating: 4,
    bestFor: "노화 방지, 칙칙한 피부, 전 피부 타입",
  },
  "tranexamic-acid": {
    name: "트라넥삼산",
    nameEn: "Tranexamic Acid",
    action: "플라스민 활성을 억제하여 멜라닌 생성과 색소침착을 줄입니다. 기미 개선에 효과적입니다.",
    timing: "아침/저녁 모두 가능. 자극이 적은 편입니다.",
    cautionCombos: [],
    synergy: ["나이아신아마이드 (미백 시너지)", "비타민C (색소 개선 시너지)"],
    tips: ["기미에 가장 효과적인 성분 중 하나로 인정받고 있어요.", "3~5% 농도가 효과적이에요."],
    effectTimeline: "색소 개선 4~8주, 기미 개선 8~12주",
    rating: 4,
    bestFor: "기미, 색소침착, 칙칙한 피부",
  },
  "azelaic-acid": {
    name: "아젤라산",
    nameEn: "Azelaic Acid",
    action: "항균, 항염, 각질 조절, 미백 효과를 동시에 내는 다기능 성분입니다.",
    timing: "아침/저녁 모두 가능.",
    cautionCombos: [],
    synergy: ["나이아신아마이드 (트러블 + 톤업)", "센텔라 (진정 시너지)"],
    tips: ["여드름과 색소침착을 동시에 잡을 수 있는 몇 안 되는 성분이에요.", "15~20% 농도가 효과적이지만 처음엔 10%부터 시작하세요."],
    effectTimeline: "트러블 개선 2~4주, 색소 개선 8~12주",
    rating: 4,
    bestFor: "여드름, 색소침착, 홍조(로사시아), 지성~복합 피부",
  },
  "salicylic-acid": {
    name: "살리실산",
    nameEn: "Salicylic Acid",
    action: "지용성 BHA로 모공 속까지 침투하여 피지와 각질을 녹이고, 항염 효과가 있습니다.",
    timing: "저녁 사용 권장.",
    cautionCombos: ["레티놀 (자극 중첩, 분리 사용 권장)"],
    synergy: ["나이아신아마이드 (피지 + 모공 관리)", "센텔라 (자극 완화)"],
    tips: ["0.5~2% 농도가 일반적이에요.", "블랙헤드, 화이트헤드에 가장 효과적인 성분이에요."],
    effectTimeline: "피지 조절 1~2주, 모공 개선 4~6주",
    rating: 4,
    bestFor: "여드름, 블랙헤드, 모공, 지성 피부",
  },
  "glycolic-acid": {
    name: "글리콜산",
    nameEn: "Glycolic Acid",
    action: "가장 작은 AHA로 침투력이 좋아 각질 제거와 콜라겐 촉진에 효과적입니다.",
    timing: "저녁 사용. 광과민성 증가로 다음날 SPF 필수.",
    cautionCombos: ["레티놀 (자극 중첩, 분리 사용 권장)", "고농도 비타민C (자극 가능)"],
    synergy: ["나이아신아마이드 (각질 제거 후 톤업)", "히알루론산 (수분 보충)"],
    tips: ["5~10%부터 시작해서 피부 반응 보고 20%까지 올릴 수 있어요.", "주 2~3회 사용 권장이에요."],
    effectTimeline: "각질 제거 즉각, 피부결 개선 2~4주",
    rating: 4,
    bestFor: "각질, 칙칙한 피부, 모공, 중성~지성 피부",
  },
  "benzoyl-peroxide": {
    name: "벤조일퍼옥사이드",
    nameEn: "Benzoyl Peroxide",
    action: "강력한 항균 작용으로 여드름균(C. acnes)을 죽이고, 모공 속 산소를 공급합니다.",
    timing: "저녁 사용 권장. 자극이 있을 수 있음.",
    cautionCombos: ["레티놀 (레티놀을 산화시켜 효과 감소)", "비타민C (산화 가능)"],
    synergy: ["나이아신아마이드 (자극 완화 + 항균)", "센텔라 (진정)"],
    tips: ["2.5% 농도가 10%와 효과는 비슷하면서 자극은 적어요.", "수건과 옷에 탈색을 일으킬 수 있으니 주의하세요."],
    effectTimeline: "항균 효과 즉각, 여드름 개선 2~4주",
    rating: 4,
    bestFor: "여드름, 지성 피부",
  },
}

/**
 * 트렌드 성분 캐시 — API 호출 없이 즉시 반환
 */
export function getTrendingCache(id: string, lang: string): string | null {
  const info = INGREDIENT_DB[id]
  if (!info) return null

  if (lang === "ko") {
    const combos = info.cautionCombos.length > 0
      ? info.cautionCombos.join("\n")
      : "특별한 주의 콤보 없음"
    return `**작용** ${info.action}

**사용 시간** ${info.timing}

**주의 콤보** ${combos}

**시너지** ${info.synergy.join(", ")}

**꿀팁**
${info.tips.map(t => `- ${t}`).join("\n")}

**효과 시기** ${info.effectTimeline}

**추천** ${"★".repeat(info.rating)}${"☆".repeat(5 - info.rating)} ${info.bestFor}`
  }

  // English fallback
  const combos = info.cautionCombos.length > 0
    ? info.cautionCombos.join("\n")
    : "No known caution combos"
  return `**Action** ${info.action}

**Timing** ${info.timing}

**Caution Combos** ${combos}

**Synergy** ${info.synergy.join(", ")}

**Tips**
${info.tips.map(t => `- ${t}`).join("\n")}

**Effect Timeline** ${info.effectTimeline}

**Rating** ${"★".repeat(info.rating)}${"☆".repeat(5 - info.rating)} ${info.bestFor}`
}

/**
 * AI 프롬프트에 주입할 성분 데이터 컨텍스트
 * 입력된 성분 중 DB에 있는 것만 정확한 정보를 전달
 */
export function getIngredientContext(names: string[]): string {
  const matched: string[] = []
  const seen = new Set<string>()

  for (const name of names.slice(0, 20)) {
    if (name.length < 2) continue
    const entry = Object.values(INGREDIENT_DB).find(
      (info) =>
        info.name === name ||
        info.nameEn.toLowerCase() === name.toLowerCase() ||
        (name.length >= 3 && name.includes(info.name)) ||
        (info.name.length >= 3 && info.name.includes(name))
    )
    if (entry && !seen.has(entry.name)) {
      seen.add(entry.name)
      const combos = entry.cautionCombos.length > 0
        ? entry.cautionCombos.join(", ")
        : "없음"
      matched.push(
        `[${entry.name}] 주의콤보: ${combos} | 시너지: ${entry.synergy.slice(0, 2).join(", ")}`
      )
    }
    if (matched.length >= 5) break
  }

  if (matched.length === 0) return ""
  return `\n\n[검증된 성분 데이터 — 이 정보를 기반으로 답하세요]\n${matched.join("\n")}`
}

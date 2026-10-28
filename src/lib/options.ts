// Opções do cadastro da empresa (E02 a E13). Os valores precisam ser idênticos aos
// permitidos pelo banco (supabase/migrations/0001_schema.sql); há um teste que confere isso.

export type Option = { value: string; label: string };

export const BUSINESS_MODELS: Option[] = [
  { value: "services", label: "Prestação de serviços" },
  { value: "products_online", label: "Venda de produtos (online)" },
  { value: "products_physical", label: "Venda de produtos (loja física)" },
];

export const SECTORS: Option[] = [
  { value: "health_aesthetics", label: "Saúde ou estética" },
  { value: "industry", label: "Indústria" },
  { value: "retail", label: "Comércio" },
  { value: "technology", label: "Tecnologia" },
  { value: "food", label: "Alimentação" },
  { value: "agribusiness", label: "Agronegócio" },
  { value: "real_estate_construction", label: "Imóveis ou construção" },
  { value: "professional_services", label: "Serviços profissionais" },
  { value: "other", label: "Outros" },
];

export const EMPLOYEES_RANGES: Option[] = [
  { value: "solo", label: "Apenas eu" },
  { value: "2_5", label: "2 a 5" },
  { value: "6_10", label: "6 a 10" },
  { value: "11_20", label: "11 a 20" },
  { value: "21_50", label: "21 a 50" },
  { value: "over_50", label: "Mais de 50" },
];

// Faixas configuráveis (o banco não restringe os valores). Campo opcional.
export const REVENUE_RANGES: Option[] = [
  { value: "up_30k", label: "Até R$ 30 mil" },
  { value: "30k_100k", label: "De R$ 30 mil a R$ 100 mil" },
  { value: "100k_300k", label: "De R$ 100 mil a R$ 300 mil" },
  { value: "300k_1m", label: "De R$ 300 mil a R$ 1 milhão" },
  { value: "over_1m", label: "Acima de R$ 1 milhão" },
  { value: "prefer_not_say", label: "Prefiro não informar" },
];

// Obrigatório. Sem "prefiro não informar"; "Não investimos atualmente" é resposta válida.
export const MARKETING_SPEND_RANGES: Option[] = [
  { value: "none", label: "Não investimos atualmente" },
  { value: "up_500", label: "Até R$ 500" },
  { value: "501_1500", label: "De R$ 501 a R$ 1.500" },
  { value: "1501_3000", label: "De R$ 1.501 a R$ 3.000" },
  { value: "3001_5000", label: "De R$ 3.001 a R$ 5.000" },
  { value: "5001_10000", label: "De R$ 5.001 a R$ 10.000" },
  { value: "over_10000", label: "Acima de R$ 10.000" },
];

export const NONE_STRUCTURED = "none_structured";

export const CHANNELS: Option[] = [
  { value: "referrals", label: "Indicações" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google_search", label: "Google ou mecanismos de pesquisa" },
  { value: "paid_ads", label: "Anúncios pagos" },
  { value: "website_blog", label: "Site ou blog" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "sales_prospecting", label: "Prospecção ou equipe comercial" },
  { value: "other", label: "Outros" },
  { value: NONE_STRUCTURED, label: "Não utilizamos canais de forma estruturada" },
];

export const MAIN_GOALS: Option[] = [
  { value: "more_contacts_short_term", label: "Gerar mais contatos ou vendas no curto prazo" },
  { value: "steady_inflow", label: "Ter uma entrada de clientes mais constante" },
  { value: "brand_differentiation", label: "Fortalecer a marca e se diferenciar" },
  { value: "organize_and_measure", label: "Organizar o marketing e entender os resultados" },
  { value: "improve_service_and_closing", label: "Melhorar o atendimento e fechar mais vendas" },
  { value: "prepare_to_grow", label: "Preparar a empresa para crescer" },
];

export const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export const values = (o: Option[]) => o.map((x) => x.value) as [string, ...string[]];

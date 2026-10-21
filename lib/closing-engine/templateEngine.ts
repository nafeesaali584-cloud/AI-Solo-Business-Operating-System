import scriptsData from './scripts.json';

export interface LeadContext {
  id?: string;
  businessName: string;
  ownerName?: string;
  location?: string;
  phone?: string;
  email?: string;
  currentWebsite?: string;
  demoLink?: string;
  pitchType?: 'redesign' | 'fresh_website';
  stage?: number;
  status?: string;
}

export interface GeneratedScript {
  type: 'stage' | 'objection';
  title: string;
  category?: string;
  stage?: number;
  pitchType?: 'redesign' | 'fresh_website';
  psychology?: string;
  goal?: string;
  whatsapp: string;
  emailSubject?: string;
  email: string;
  timingTip?: string;
  whatsAppUrl: string;
}

export function renderTemplate(template: string, lead: LeadContext): string {
  if (!template) return '';
  return template
    .replace(/\{\{owner_name\}\}/g, lead.ownerName || 'there')
    .replace(/\{\{business_name\}\}/g, lead.businessName || 'your garage')
    .replace(/\{\{location\}\}/g, lead.location || 'Dubai')
    .replace(/\{\{demo_link\}\}/g, lead.demoLink || 'https://demo.youragency.com')
    .replace(/\{\{current_website\}\}/g, lead.currentWebsite || 'your website');
}

export function generateWhatsAppUrl(phone?: string, text?: string): string {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text || '')}`;
}

export function getStageScript(lead: LeadContext, stageNum?: number): GeneratedScript {
  const currentStage = stageNum !== undefined ? stageNum : (lead.stage || 1);
  const pitchType = lead.pitchType || (lead.currentWebsite ? 'redesign' : 'fresh_website');
  
  const stageList = (pitchType === 'fresh_website' && (scriptsData as any).freshStages)
    ? (scriptsData as any).freshStages
    : ((scriptsData as any).redesignStages || (scriptsData as any).stages || []);

  const stage = stageList.find((s: any) => s.stage === Number(currentStage)) || stageList[0] || {};

  const renderedWhatsApp = renderTemplate(stage.whatsapp || '', lead);
  const renderedEmail = renderTemplate(stage.email || '', lead);
  const renderedSubject = renderTemplate(stage.emailSubject || '', lead);

  return {
    type: 'stage',
    pitchType: pitchType,
    stage: stage.stage,
    title: stage.title || `Stage ${currentStage}`,
    psychology: stage.psychology,
    goal: stage.goal,
    whatsapp: renderedWhatsApp,
    emailSubject: renderedSubject,
    email: renderedEmail,
    timingTip: stage.stage === 1
      ? 'Send Tuesday to Thursday between 10:30 AM and 1:00 PM UAE time.'
      : `Recommended wait time: ${stage.delayDays || 2} days after previous touch.`,
    whatsAppUrl: generateWhatsAppUrl(lead.phone, renderedWhatsApp)
  };
}

export function getObjectionScript(objectionId: string, lead: LeadContext): GeneratedScript | null {
  const objections = (scriptsData as any).objections || [];
  const objection = objections.find((o: any) => o.id === objectionId);
  if (!objection) return null;

  const renderedWhatsApp = renderTemplate(objection.whatsapp || '', lead);
  const renderedEmail = renderTemplate(objection.email || '', lead);

  return {
    type: 'objection',
    title: objection.title,
    category: objection.category || 'Objection',
    whatsapp: renderedWhatsApp,
    email: renderedEmail,
    psychology: 'ACRC Framework (Acknowledge, Clarify, Respond, Confirm) + Outcome Detachment.',
    timingTip: 'Reply within 15-30 minutes while the prospect is still thinking about your message.',
    whatsAppUrl: generateWhatsAppUrl(lead.phone, renderedWhatsApp)
  };
}

export function getAllObjections() {
  return (scriptsData as any).objections || [];
}

export function getAllStages(pitchType: 'redesign' | 'fresh_website' = 'redesign') {
  if (pitchType === 'fresh_website' && (scriptsData as any).freshStages) {
    return (scriptsData as any).freshStages;
  }
  return (scriptsData as any).redesignStages || (scriptsData as any).stages || [];
}

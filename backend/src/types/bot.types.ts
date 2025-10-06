import { Context, Scenes } from "telegraf";

interface BotWizardSession extends Scenes.WizardSession {
  product?: {
    name: string;
    description?: string | null;
    sku: string;
    unit_price: number;
    selling_price: number;
    unit: string;
    category?: string | null;
    image_url?: string | null;
  };
}

export interface BotContext extends Context {
  // @ts-ignore
  scene: Scenes.SceneContextScene<BotContext, BotWizardSession>; // @ts-ignore
  wizard: Scenes.WizardContextWizard<BotContext>;
  session: BotWizardSession;
}

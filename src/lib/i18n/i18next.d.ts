import type enUS from "./locales/en-US.json";

declare module "i18next" {
  type CustomTypeOptions = {
    defaultNS: "translation";
    resources: {
      translation: typeof enUS;
    };
  };
}

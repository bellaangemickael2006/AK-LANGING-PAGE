export type ContentType = "actualite" | "formation" | "ebook" | "article" | "promotion";
export type CtaAction = "inscription" | "telechargement" | "info";
export type ImageOrientation = "paysage" | "portrait";

export interface ContentItem {
  id: string;
  type: ContentType;
  titre: string;
  chapo: string;
  corps: string;
  imageUrl: string;
  datePublication: string;
  dateFin: string;
  departement: string;
  ctaLabel: string;
  ctaAction: CtaAction;
  fichierUrl: string;
  visible: boolean;
  ordre: number;
  infosPratiques: string;
  imageOrientation: ImageOrientation;
}

export type LeadActionType = "inscription" | "telechargement" | "info";

export interface LeadPayload {
  nom: string;
  profession: string;
  activite: string;
  telephone: string;
  email: string;
  honeypot?: string;
  type: LeadActionType;
  itemId: string;
  itemTitre: string;
  departement: string;
}

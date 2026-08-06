import type { ParsedHub3Data } from "../utils/parseHub3";
import type { ParsedOcrData } from "../utils/parseOcrText";

export interface PickedImage {
  uri: string;
  mimeType?: string;
  fileName?: string;
}

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  PaymentSlipList: undefined;
  AddPaymentSlip: undefined;
  PropertyList: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  AppTabs: undefined;
  AddChoice: undefined;
  ScanPaymentSlip: undefined;
  OcrScanPaymentSlip: undefined;
  Notifications: undefined;
  PropertyForm: { propertyId: number } | undefined;
  PaymentSlipForm:
    | { paymentSlipId: number }
    | { scannedData: ParsedHub3Data }
    | { ocrData: ParsedOcrData; sourceImage?: PickedImage }
    | undefined;
};

import type { ParsedHub3Data } from "../utils/parseHub3";

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
  PropertyForm: { propertyId: number } | undefined;
  PaymentSlipForm:
    | { paymentSlipId: number }
    | { scannedData: ParsedHub3Data }
    | undefined;
};

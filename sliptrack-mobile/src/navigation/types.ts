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
  PropertyForm: { propertyId: number } | undefined;
  PaymentSlipForm: { paymentSlipId: number } | undefined;
};

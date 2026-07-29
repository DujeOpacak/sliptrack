export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  PropertyList: undefined;
  PropertyForm: { propertyId: number } | undefined;
  PaymentSlipList: undefined;
  PaymentSlipForm: { paymentSlipId: number } | undefined;
};

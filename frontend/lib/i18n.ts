export type Language = 'en' | 'am' | 'or';

export const languages = {
  en: 'English',
  am: 'አማርኛ',
  or: 'Afaan Oromoo'
};

// Single source of truth for all UI string keys.
// Adding a key here forces all three language maps to provide it.
export interface TranslationKeys {
  // Navigation & Auth
  home: string;
  aboutUs: string;
  faq: string;
  pricing: string;
  tutorials: string;
  register: string;
  signIn: string;
  logout: string;
  language: string;
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  view: string;

  // Auth pages
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  confirmPassword: string;
  createAccount: string;
  forgotPassword: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  verifyAccount: string;
  verificationCode: string;
  resendCode: string;
  resetPassword: string;
  newPassword: string;

  // Hero/Landing
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchButton: string;
  secureBidding: string;
  secureBiddingDesc: string;
  instantUpdates: string;
  instantUpdatesDesc: string;
  bestDeals: string;
  bestDealsDesc: string;
  verifiedSellers: string;
  verifiedSellersDesc: string;

  // Categories
  electronics: string;
  vehicles: string;
  jewelry: string;
  homeGarden: string;
  artCollectibles: string;
  fashionClothing: string;
  realEstate: string;
  agriculturalEquipment: string;

  // Dashboard
  dashboard: string;
  myBids: string;
  myAuctions: string;
  watchlist: string;
  messages: string;
  settings: string;
  marketplace: string;
  myWallet: string;
  myPortfolio: string;
  bidHistory2: string;
  notifications: string;
  unread: string;
  allCaughtUp: string;
  markAllRead: string;

  // Auction
  createAuction: string;
  browseAuctions: string;
  currentBid: string;
  timeLeft: string;
  placeBid: string;
  buyNow: string;
  addToWatchlist: string;
  bidHistory: string;
  description: string;
  seller: string;
  startingBid: string;
  reservePrice: string;
  buyNowPrice: string;
  auctionEnded: string;
  youWon: string;
  proceedToPayment: string;
  noBidsYet: string;
  autoBid: string;
  setAutoBid: string;
  maxAutoBid: string;

  // Wallet
  addFunds: string;
  walletBalance: string;
  availableBalance: string;
  inEscrow: string;
  transactionHistory: string;
  deposit: string;
  withdraw: string;
  paymentMethod: string;
  telebirr: string;
  chapa: string;
  cbeBirr: string;

  // Seller
  becomeSeller: string;
  sellerDashboard: string;
  createListing: string;
  myListings: string;
  totalSales: string;
  totalRevenue: string;
  pendingOrders: string;
  activeAuctions: string;
  uploadPhotos: string;
  itemCondition: string;
  itemDescription: string;

  // Disputes & Reports
  openDispute: string;
  disputeReason: string;
  disputeDescription: string;
  submitDispute: string;
  reportUser: string;
  reportAuction: string;
  reportReason: string;
  reportDescription: string;
  submitReport: string;

  // Status messages
  success: string;
  error: string;
  warning: string;
  info: string;
  bidPlaced: string;
  bidFailed: string;
  outbid: string;
  auctionWon: string;
  paymentSuccess: string;
  paymentFailed: string;
  verificationRequired: string;
  insufficientBalance: string;
  itemNotFound: string;

  // Admin
  adminDashboard: string;
  totalUsers: string;
  totalAuctions: string;
  pendingDisputes: string;
  revenueTotal: string;
  userManagement: string;
  auctionManagement: string;
  disputeManagement: string;
  reportManagement: string;
  transactionManagement: string;
  sellerApproval: string;
  fraudDetection: string;
  analyticsTab: string;
  activityLog: string;
  blockUser: string;
  unblockUser: string;
  verifyUser: string;
  deleteUser: string;
  approveApplication: string;
  rejectApplication: string;
  releaseEscrow: string;
  resolveDispute: string;

  // Analytics
  analytics: string;
  bidsPerDay: string;
  revenuePerDay: string;
  registrationsPerDay: string;
  categoryDistribution: string;
  timeRange: string;
  days7: string;
  days30: string;
  days90: string;
  noDataAvailable: string;
  totalBids: string;
  avgBidsPerAuction: string;
}

const en: TranslationKeys = {
  // Navigation & Auth
  home: 'HOME',
  aboutUs: 'ABOUT US',
  faq: 'FAQ',
  pricing: 'PRICING',
  tutorials: 'TUTORIALS',
  register: 'REGISTER',
  signIn: 'SIGN IN',
  logout: 'Logout',
  language: 'Language',
  loading: 'Loading...',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  view: 'View',

  // Auth pages
  email: 'Email',
  password: 'Password',
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  confirmPassword: 'Confirm Password',
  createAccount: 'Create Account',
  forgotPassword: 'Forgot Password?',
  dontHaveAccount: "Don't have an account?",
  alreadyHaveAccount: 'Already have an account?',
  verifyAccount: 'Verify Account',
  verificationCode: 'Verification Code',
  resendCode: 'Resend Code',
  resetPassword: 'Reset Password',
  newPassword: 'New Password',

  // Hero/Landing
  heroTitle: "Welcome to Ethiopia's Premier Auction Platform",
  heroSubtitle: 'Discover unique items, place bids, and win incredible deals.',
  searchPlaceholder: 'Search for auctions...',
  searchButton: 'Search',
  secureBidding: 'Secure Bidding',
  secureBiddingDesc: 'Your bids are protected with enterprise-level security',
  instantUpdates: 'Instant Updates',
  instantUpdatesDesc: 'Get real-time notifications on your auction activity',
  bestDeals: 'Best Deals',
  bestDealsDesc: 'Find incredible deals on premium items every day',
  verifiedSellers: 'Verified Sellers',
  verifiedSellersDesc: 'All sellers are verified for your peace of mind',

  // Categories
  electronics: 'Electronics',
  vehicles: 'Vehicles',
  jewelry: 'Jewelry',
  homeGarden: 'Home & Garden',
  artCollectibles: 'Art & Collectibles',
  fashionClothing: 'Fashion & Clothing',
  realEstate: 'Real Estate',
  agriculturalEquipment: 'Agricultural Equipment',

  // Dashboard
  dashboard: 'Dashboard',
  myBids: 'My Bids',
  myAuctions: 'My Auctions',
  watchlist: 'Watchlist',
  messages: 'Messages',
  settings: 'Settings',
  marketplace: 'Marketplace',
  myWallet: 'My Wallet',
  myPortfolio: 'My Portfolio',
  bidHistory2: 'Bid History',
  notifications: 'Notifications',
  unread: 'Unread',
  allCaughtUp: 'All caught up!',
  markAllRead: 'Mark all as read',

  // Auction
  createAuction: 'Create Auction',
  browseAuctions: 'Browse Auctions',
  currentBid: 'Current Bid',
  timeLeft: 'Time Left',
  placeBid: 'Place Bid',
  buyNow: 'Buy Now',
  addToWatchlist: 'Add to Watchlist',
  bidHistory: 'Bid History',
  description: 'Description',
  seller: 'Seller',
  startingBid: 'Starting Bid',
  reservePrice: 'Reserve Price',
  buyNowPrice: 'Buy Now Price',
  auctionEnded: 'Auction Ended',
  youWon: 'You Won!',
  proceedToPayment: 'Proceed to Payment',
  noBidsYet: 'No bids yet',
  autoBid: 'Auto Bid',
  setAutoBid: 'Set Auto Bid',
  maxAutoBid: 'Max Auto Bid Amount',

  // Wallet
  addFunds: 'Add Funds',
  walletBalance: 'Wallet Balance',
  availableBalance: 'Available Balance',
  inEscrow: 'In Escrow',
  transactionHistory: 'Transaction History',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  paymentMethod: 'Payment Method',
  telebirr: 'Telebirr',
  chapa: 'Chapa',
  cbeBirr: 'CBE Birr',

  // Seller
  becomeSeller: 'Become a Seller',
  sellerDashboard: 'Seller Dashboard',
  createListing: 'Create Listing',
  myListings: 'My Listings',
  totalSales: 'Total Sales',
  totalRevenue: 'Total Revenue',
  pendingOrders: 'Pending Orders',
  activeAuctions: 'Active Auctions',
  uploadPhotos: 'Upload Photos',
  itemCondition: 'Item Condition',
  itemDescription: 'Item Description',

  // Disputes & Reports
  openDispute: 'Open Dispute',
  disputeReason: 'Dispute Reason',
  disputeDescription: 'Dispute Description',
  submitDispute: 'Submit Dispute',
  reportUser: 'Report User',
  reportAuction: 'Report Auction',
  reportReason: 'Report Reason',
  reportDescription: 'Report Description',
  submitReport: 'Submit Report',

  // Status messages
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  bidPlaced: 'Bid placed successfully',
  bidFailed: 'Bid failed',
  outbid: 'You have been outbid',
  auctionWon: 'Auction won',
  paymentSuccess: 'Payment successful',
  paymentFailed: 'Payment failed',
  verificationRequired: 'Verification required',
  insufficientBalance: 'Insufficient balance',
  itemNotFound: 'Item not found',

  // Admin
  adminDashboard: 'Admin Dashboard',
  totalUsers: 'Total Users',
  totalAuctions: 'Total Auctions',
  pendingDisputes: 'Pending Disputes',
  revenueTotal: 'Total Revenue',
  userManagement: 'User Management',
  auctionManagement: 'Auction Management',
  disputeManagement: 'Dispute Management',
  reportManagement: 'Report Management',
  transactionManagement: 'Transaction Management',
  sellerApproval: 'Seller Approval',
  fraudDetection: 'Fraud Detection',
  analyticsTab: 'Analytics',
  activityLog: 'Activity Log',
  blockUser: 'Block User',
  unblockUser: 'Unblock User',
  verifyUser: 'Verify User',
  deleteUser: 'Delete User',
  approveApplication: 'Approve Application',
  rejectApplication: 'Reject Application',
  releaseEscrow: 'Release Escrow',
  resolveDispute: 'Resolve Dispute',

  // Analytics
  analytics: 'Analytics',
  bidsPerDay: 'Bids Per Day',
  revenuePerDay: 'Revenue Per Day',
  registrationsPerDay: 'Registrations Per Day',
  categoryDistribution: 'Category Distribution',
  timeRange: 'Time Range',
  days7: '7 Days',
  days30: '30 Days',
  days90: '90 Days',
  noDataAvailable: 'No data available',
  totalBids: 'Total Bids',
  avgBidsPerAuction: 'Avg Bids Per Auction',
};

const am: TranslationKeys = {
  // Navigation & Auth
  home: 'መነሻ',
  aboutUs: 'ስለ እኛ',
  faq: 'ጥያቄዎች',
  pricing: 'ዋጋ',
  tutorials: 'ትምህርቶች',
  register: 'ይመዝገቡ',
  signIn: 'ይግቡ',
  logout: 'ውጣ',
  language: 'ቋንቋ',
  loading: 'በመጫን ላይ...',
  save: 'አስቀምጥ',
  cancel: 'ሰርዝ',
  delete: 'ሰርዝ',
  edit: 'አርትዕ',
  view: 'ይመልከቱ',

  // Auth pages
  email: 'ኢሜይል',
  password: 'የይለፍ ቃል',
  fullName: 'ሙሉ ስም',
  phoneNumber: 'ስልክ ቁጥር',
  confirmPassword: 'የይለፍ ቃል ያረጋግጡ',
  createAccount: 'መለያ ፍጠር',
  forgotPassword: 'የይለፍ ቃል ረሱ?',
  dontHaveAccount: 'መለያ የለዎትም?',
  alreadyHaveAccount: 'መለያ አለዎት?',
  verifyAccount: 'መለያ ያረጋግጡ',
  verificationCode: 'የማረጋገጫ ኮድ',
  resendCode: 'ኮድ እንደገና ላክ',
  resetPassword: 'የይለፍ ቃል ዳግም አስጀምር',
  newPassword: 'አዲስ የይለፍ ቃል',

  // Hero/Landing
  heroTitle: 'እንኳን ወደ ኢትዮጵያ ቀዳሚ የጨረታ መድረክ በደህና መጡ',
  heroSubtitle: 'ልዩ ዕቃዎችን ያግኙ፣ ጨረታ ያድርጉ እና አስደናቂ ስምምነቶችን ያሸንፉ።',
  searchPlaceholder: 'ጨረታዎችን ይፈልጉ...',
  searchButton: 'ፈልግ',
  secureBidding: 'ደህንነቱ የተጠበቀ ጨረታ',
  secureBiddingDesc: 'ጨረታዎችዎ በድርጅት ደረጃ ደህንነት የተጠበቁ ናቸው',
  instantUpdates: 'ፈጣን ማሻሻያዎች',
  instantUpdatesDesc: 'በጨረታ እንቅስቃሴዎ ላይ የእውነተኛ ጊዜ ማሳወቂያዎችን ያግኙ',
  bestDeals: 'ምርጥ ስምምነቶች',
  bestDealsDesc: 'በየቀኑ በፕሪሚየም እቃዎች ላይ አስደናቂ ስምምነቶችን ያግኙ',
  verifiedSellers: 'የተረጋገጡ ሻጮች',
  verifiedSellersDesc: 'ሁሉም ሻጮች ለእርስዎ የአእምሮ ሰላም የተረጋገጡ ናቸው',

  // Categories
  electronics: 'ኤሌክትሮኒክስ',
  vehicles: 'ተሽከርካሪዎች',
  jewelry: 'ጌጣጌጥ',
  homeGarden: 'ቤት እና የአትክልት ቦታ',
  artCollectibles: 'ጥበብ እና ስብስቦች',
  fashionClothing: 'ፋሽን እና ልብስ',
  realEstate: 'ሪል እስቴት',
  agriculturalEquipment: 'የግብርና መሳሪያዎች',

  // Dashboard
  dashboard: 'ዳሽቦርድ',
  myBids: 'የእኔ ጨረታዎች',
  myAuctions: 'የእኔ ጨረታዎች',
  watchlist: 'የክትትል ዝርዝር',
  messages: 'መልዕክቶች',
  settings: 'ቅንብሮች',
  marketplace: 'ገበያ',
  myWallet: 'የእኔ ቦርሳ',
  myPortfolio: 'የእኔ ፖርትፎሊዮ',
  bidHistory2: 'የጨረታ ታሪክ',
  notifications: 'ማሳወቂያዎች',
  unread: 'ያልተነበበ',
  allCaughtUp: 'ሁሉም ተነብቧል',
  markAllRead: 'ሁሉንም እንደተነበበ ምልክት አድርግ',

  // Auction
  createAuction: 'ጨረታ ፍጠር',
  browseAuctions: 'ጨረታዎችን አስስ',
  currentBid: 'የአሁኑ ጨረታ',
  timeLeft: 'የቀረው ጊዜ',
  placeBid: 'ጨረታ አድርግ',
  buyNow: 'አሁን ግዛ',
  addToWatchlist: 'ወደ ክትትል ዝርዝር አክል',
  bidHistory: 'የጨረታ ታሪክ',
  description: 'መግለጫ',
  seller: 'ሻጭ',
  startingBid: 'የጀምሪያ ጨረታ',
  reservePrice: 'የተጠበቀ ዋጋ',
  buyNowPrice: 'አሁን ግዛ ዋጋ',
  auctionEnded: 'ጨረታ ተጠናቋል',
  youWon: 'አሸነፍህ!',
  proceedToPayment: 'ወደ ክፍያ ቀጥል',
  noBidsYet: 'እስካሁን ጨረታ የለም',
  autoBid: 'ራስ-ጨረታ',
  setAutoBid: 'ራስ-ጨረታ አዘጋጅ',
  maxAutoBid: 'ከፍተኛ ራስ-ጨረታ መጠን',

  // Wallet
  addFunds: 'ገንዘብ ጨምር',
  walletBalance: 'የቦርሳ ቀሪ ሂሳብ',
  availableBalance: 'ያለ ቀሪ ሂሳብ',
  inEscrow: 'በኤስክሮ ውስጥ',
  transactionHistory: 'የግብይት ታሪክ',
  deposit: 'ተቀማጭ',
  withdraw: 'አውጣ',
  paymentMethod: 'የክፍያ ዘዴ',
  telebirr: 'ቴሌብር',
  chapa: 'ቻፓ',
  cbeBirr: 'ሲቢኢ ብር',

  // Seller
  becomeSeller: 'ሻጭ ሁን',
  sellerDashboard: 'የሻጭ ዳሽቦርድ',
  createListing: 'ዝርዝር ፍጠር',
  myListings: 'የእኔ ዝርዝሮች',
  totalSales: 'ጠቅላላ ሽያጮች',
  totalRevenue: 'ጠቅላላ ገቢ',
  pendingOrders: 'በመጠባበቅ ላይ ያሉ ትዕዛዞች',
  activeAuctions: 'ንቁ ጨረታዎች',
  uploadPhotos: 'ፎቶዎች ስቀል',
  itemCondition: 'የዕቃ ሁኔታ',
  itemDescription: 'የዕቃ መግለጫ',

  // Disputes & Reports
  openDispute: 'ክርክር ክፈት',
  disputeReason: 'የክርክር ምክንያት',
  disputeDescription: 'የክርክር መግለጫ',
  submitDispute: 'ክርክር አስገባ',
  reportUser: 'ተጠቃሚ ሪፖርት አድርግ',
  reportAuction: 'ጨረታ ሪፖርት አድርግ',
  reportReason: 'የሪፖርት ምክንያት',
  reportDescription: 'የሪፖርት መግለጫ',
  submitReport: 'ሪፖርት አስገባ',

  // Status messages
  success: 'ተሳክቷል',
  error: 'ስህተት',
  warning: 'ማስጠንቀቂያ',
  info: 'መረጃ',
  bidPlaced: 'ጨረታ ተቀምጧል',
  bidFailed: 'ጨረታ አልተሳካም',
  outbid: 'ጨረታ ተሸነፈ',
  auctionWon: 'ጨረታ ተሸነፈ',
  paymentSuccess: 'ክፍያ ተሳክቷል',
  paymentFailed: 'ክፍያ አልተሳካም',
  verificationRequired: 'ማረጋገጫ ያስፈልጋል',
  insufficientBalance: 'በቂ ቀሪ ሂሳብ የለም',
  itemNotFound: 'ዕቃ አልተገኘም',

  // Admin
  adminDashboard: 'የአስተዳዳሪ ዳሽቦርድ',
  totalUsers: 'ጠቅላላ ተጠቃሚዎች',
  totalAuctions: 'ጠቅላላ ጨረታዎች',
  pendingDisputes: 'በመጠባበቅ ላይ ያሉ ክርክሮች',
  revenueTotal: 'ጠቅላላ ገቢ',
  userManagement: 'የተጠቃሚ አስተዳደር',
  auctionManagement: 'የጨረታ አስተዳደር',
  disputeManagement: 'የክርክር አስተዳደር',
  reportManagement: 'የሪፖርት አስተዳደር',
  transactionManagement: 'የግብይት አስተዳደር',
  sellerApproval: 'የሻጭ ማፅደቅ',
  fraudDetection: 'የማጭበርበር ፍለጋ',
  analyticsTab: 'ትንታኔ',
  activityLog: 'የእንቅስቃሴ ምዝግብ',
  blockUser: 'ተጠቃሚ አግድ',
  unblockUser: 'ተጠቃሚ ክልከላ አንሳ',
  verifyUser: 'ተጠቃሚ አረጋግጥ',
  deleteUser: 'ተጠቃሚ ሰርዝ',
  approveApplication: 'ማመልከቻ አፅድቅ',
  rejectApplication: 'ማመልከቻ ውድቅ አድርግ',
  releaseEscrow: 'ኤስክሮ ፈታ',
  resolveDispute: 'ክርክር ፍታ',

  // Analytics
  analytics: 'ትንታኔ',
  bidsPerDay: 'በቀን ጨረታዎች',
  revenuePerDay: 'በቀን ገቢ',
  registrationsPerDay: 'በቀን ምዝገባዎች',
  categoryDistribution: 'የምድብ ስርጭት',
  timeRange: 'የጊዜ ክልል',
  days7: '7 ቀናት',
  days30: '30 ቀናት',
  days90: '90 ቀናት',
  noDataAvailable: 'ምንም ውሂብ የለም',
  totalBids: 'ጠቅላላ ጨረታዎች',
  avgBidsPerAuction: 'በጨረታ አማካይ ጨረታዎች',
};

const or: TranslationKeys = {
  // Navigation & Auth
  home: 'MANA',
  aboutUs: "WAAʼEE KEENYA",
  faq: 'GAAFFII',
  pricing: 'GATII',
  tutorials: 'BARNOOTA',
  register: "GALMAAʼI",
  signIn: 'SEENI',
  logout: "Ba'i",
  language: 'Afaan',
  loading: "Fe'aa jira...",
  save: "Olkaa'i",
  cancel: 'Dhiisi',
  delete: 'Haqi',
  edit: 'Gulaali',
  view: 'Ilaali',

  // Auth pages
  email: 'Imeelii',
  password: 'Jecha Icciitii',
  fullName: 'Maqaa Guutuu',
  phoneNumber: 'Lakkoofsa Bilbilaa',
  confirmPassword: 'Jecha Icciitii Mirkaneessi',
  createAccount: 'Herrega Uumi',
  forgotPassword: 'Jecha Icciitii Irraanfatte?',
  dontHaveAccount: 'Herrega hin qabdu?',
  alreadyHaveAccount: 'Herrega qabdaa?',
  verifyAccount: 'Herrega Mirkaneessi',
  verificationCode: 'Koodii Mirkaneessaa',
  resendCode: 'Koodii Irra Ergii',
  resetPassword: 'Jecha Icciitii Haaromsi',
  newPassword: 'Jecha Icciitii Haaraa',

  // Hero/Landing
  heroTitle: 'Baga Gara Waltajjii Gabaa Itoophiyaa Guddichatti Dhuftan',
  heroSubtitle: 'Meeshaalee addaa argadhu, gatii dhiheessi.',
  searchPlaceholder: 'Gabaa barbaadi...',
  searchButton: 'Barbaadi',
  secureBidding: 'Gatii Dhiheessuu Nageenya Qabu',
  secureBiddingDesc: 'Gatiin kee dhiheessitu nageenya sadarkaa dhaabbataa qabu',
  instantUpdates: "Fooyya'iinsa Ariifachiisaa",
  instantUpdatesDesc: 'Sochiiwwan gabaa keetii irratti beeksisa yeroo qabatamaa argadhu',
  bestDeals: 'Walii Galtee Gaarii',
  bestDealsDesc: "Guyyaa guyyaan meeshaalee gatii guddaa qaban irratti walii galtee ajaaʼibaa argadhu",
  verifiedSellers: 'Gurgurtootaa Mirkaneeffaman',
  verifiedSellersDesc: 'Gurgurtoonni hundi nageenya sammuu keetiitiif mirkaneeffamaniiru',

  // Categories
  electronics: 'Elektirooniksii',
  vehicles: 'Konkolaataa',
  jewelry: 'Faaya',
  homeGarden: 'Mana & Iddoo Biqiltuu',
  artCollectibles: 'Aartii fi Walitti Qabeenya',
  fashionClothing: 'Faashiinii fi Uffata',
  realEstate: 'Qabeenya Dachaa',
  agriculturalEquipment: 'Meeshaalee Qonnaa',

  // Dashboard
  dashboard: 'Gabatee',
  myBids: 'Gatii Koo Dhiheesse',
  myAuctions: 'Gabaa Koo',
  watchlist: 'Tarree Ilaalchaa',
  messages: 'Ergaawwan',
  settings: "Qindaa'ina",
  marketplace: 'Gabaa',
  myWallet: 'Supscription Koo',
  myPortfolio: 'Portfolioo Koo',
  bidHistory2: 'Seenaa Gatii Dhiheessuu',
  notifications: 'Beeksisaalee',
  unread: 'Hin Dubbifamne',
  allCaughtUp: 'Hundi Dubbifameera',
  markAllRead: 'Hunda Dubbifame Godhi',

  // Auction
  createAuction: 'Gabaa Uumi',
  browseAuctions: "Gabaa Sakatta'i",
  currentBid: 'Gatii Ammaa',
  timeLeft: 'Yeroo Hafe',
  placeBid: 'Gatii Dhiheessi',
  buyNow: 'Amma Biti',
  addToWatchlist: "Gara Tarree Ilaalchaatti Ida'i",
  bidHistory: 'Seenaa Gatii Dhiheessuu',
  description: 'Ibsa',
  seller: 'Gurgurtaa',
  startingBid: 'Gatii Jalqabaa',
  reservePrice: 'Gatii Kabachiifame',
  buyNowPrice: 'Gatii Amma Bituu',
  auctionEnded: 'Gabaan Xumurame',
  youWon: "Mo'atte!",
  proceedToPayment: 'Gara Kaffaltiitti Itti Fufi',
  noBidsYet: 'Gatii Hin Dhihaanne Ammaaf',
  autoBid: 'Gatii Ofumaa',
  setAutoBid: 'Gatii Ofumaa Qindeessi',
  maxAutoBid: 'Gatii Ofumaa Guddaa',

  // Wallet
  addFunds: "Maallaqaa Ida'i",
  walletBalance: 'Balansi Supscription',
  availableBalance: 'Balansi Jiru',
  inEscrow: 'Escrow Keessa',
  transactionHistory: 'Seenaa Daldalaa',
  deposit: "Kaa'i",
  withdraw: 'Baasi',
  paymentMethod: 'Mala Kaffaluu',
  telebirr: 'Telebirr',
  chapa: 'Chapa',
  cbeBirr: 'CBE Birr',

  // Seller
  becomeSeller: "Gurgurtaa Ta'i",
  sellerDashboard: 'Gabatee Gurgurtaa',
  createListing: 'Tarree Uumi',
  myListings: 'Tarreewwan Koo',
  totalSales: 'Gurgurtaa Waliigalaa',
  totalRevenue: 'Galii Waliigalaa',
  pendingOrders: 'Ajajaalee Eegaa Jiran',
  activeAuctions: "Gabaalee Socho'aa",
  uploadPhotos: "Suuraalee Fe'i",
  itemCondition: 'Haala Meeshaa',
  itemDescription: 'Ibsa Meeshaa',

  // Disputes & Reports
  openDispute: 'Falmii Bani',
  disputeReason: 'Sababa Falmii',
  disputeDescription: 'Ibsa Falmii',
  submitDispute: 'Falmii Galchi',
  reportUser: 'Fayyadamaa Gabaasi',
  reportAuction: 'Gabaa Gabaasi',
  reportReason: 'Sababa Gabaasaa',
  reportDescription: 'Ibsa Gabaasaa',
  submitReport: 'Gabaasa Galchi',

  // Status messages
  success: "Milkaa'e",
  error: 'Dogoggora',
  warning: 'Akeekkachiisa',
  info: 'Odeeffannoo',
  bidPlaced: 'Gatiin Dhihaate',
  bidFailed: 'Gatiin Hin Milkoofne',
  outbid: 'Gatiin Caale',
  auctionWon: 'Gabaan Mo\'atame',
  paymentSuccess: "Kaffaltiin Milkaa'e",
  paymentFailed: 'Kaffaltiin Hin Milkoofne',
  verificationRequired: 'Mirkaneessaan Barbaachisa',
  insufficientBalance: "Balansi Ga'aa Miti",
  itemNotFound: 'Meeshaan Hin Argamne',

  // Admin
  adminDashboard: 'Gabatee Bulchiinsaa',
  totalUsers: 'Fayyadamtoota Waliigalaa',
  totalAuctions: 'Gabaalee Waliigalaa',
  pendingDisputes: 'Falmiilee Eegaa Jiran',
  revenueTotal: 'Galii Waliigalaa',
  userManagement: 'Bulchiinsa Fayyadamaa',
  auctionManagement: 'Bulchiinsa Gabaa',
  disputeManagement: 'Bulchiinsa Falmii',
  reportManagement: 'Bulchiinsa Gabaasaa',
  transactionManagement: 'Bulchiinsa Daldalaa',
  sellerApproval: 'Hayyama Gurgurtaa',
  fraudDetection: 'Dogoggora Argachuu',
  analyticsTab: 'Xiinxala',
  activityLog: "Galmee Socho'aa",
  blockUser: 'Fayyadamaa Cufii',
  unblockUser: 'Fayyadamaa Banaa',
  verifyUser: 'Fayyadamaa Mirkaneessi',
  deleteUser: 'Fayyadamaa Haqi',
  approveApplication: 'Iyyaannoo Hayyami',
  rejectApplication: 'Iyyaannoo Didi',
  releaseEscrow: 'Escrow Gadhiisi',
  resolveDispute: 'Falmii Furmaata Kenni',

  // Analytics
  analytics: 'Xiinxala',
  bidsPerDay: 'Gatii Guyyaa Tokkotti',
  revenuePerDay: 'Galii Guyyaa Tokkotti',
  registrationsPerDay: 'Galmaawwan Guyyaa Tokkotti',
  categoryDistribution: 'Raabsa Gosa',
  timeRange: 'Yeroo Daangaa',
  days7: 'Guyyaa 7',
  days30: 'Guyyaa 30',
  days90: 'Guyyaa 90',
  noDataAvailable: 'Odeeffannoon Hin Jiru',
  totalBids: 'Gatii Waliigalaa',
  avgBidsPerAuction: 'Gatii Gabaa Tokkotti Giddugaleessa',
};

const translations: Record<Language, TranslationKeys> = { en, am, or };

/**
 * Get a translation for the given language and key.
 * Falls back to English when the key is missing from the selected language.
 * Never returns the raw key string.
 */
export function getTranslation(lang: Language, key: keyof TranslationKeys): string {
  return translations[lang][key] ?? translations['en'][key];
}

/** Alias for getTranslation — used by LanguageContext as t(key) via partial application */
export const t = getTranslation;

/**
 * Serialize a TranslationKeys map to a JSON string.
 */
export function serializeMap(map: TranslationKeys): string {
  return JSON.stringify(map);
}

/**
 * Deserialize a JSON string back into a TranslationKeys object.
 * Returns { error: "Missing key: <firstMissingKey>" } if any required key is absent.
 * Returns { error: "Invalid JSON" } if the string is malformed.
 */
export function deserializeMap(json: string): TranslationKeys | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: 'Invalid JSON' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { error: 'Invalid JSON' };
  }

  const requiredKeys = Object.keys(en) as Array<keyof TranslationKeys>;
  for (const key of requiredKeys) {
    if (!(key in (parsed as Record<string, unknown>))) {
      return { error: `Missing key: ${key}` };
    }
  }

  return parsed as TranslationKeys;
}

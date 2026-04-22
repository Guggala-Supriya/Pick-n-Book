import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { UserProvider } from "./UserContext";
import { useAuthSession } from "./api/authSession";

import Topbar from "./Topbar";
import HomePage from "./HomePage";
import WebCheckinPage from "./WebCheckinPage";
import PrintTicketPage from "./PrintTicketPage";
import FetchTicket from "./FetchTicket";
import Login from "./Authentications/Login";
import Register from "./Authentications/Register";
import VerifyOtp from "./Authentications/VerifyOtp";
import ChangePassword from "./Authentications/ChangePassword";
import Forgetpassword from "./Authentications/RESETPASSWORD";
import DashboardLayout from "./DashbaordLayout";
import DashboardPage from "./DashboardPage";
import DataTable from "./Components/DataTable";

import BankList from "./pages/BankList";
import QRList from "./pages/QRList";
import DepositRequest from "./pages/DepositRequest";
import TravelerList from "./pages/TravelerList";
import FlightBookings from "./pages/FlightBookings";
import FlightCancel from "./pages/FlightCancel";
import BusBookings from "./pages/BusBookings";
import BusCancel from "./pages/BusCancel";
import AccountStatement from "./pages/AccountStatement";
import EditProfile from "./pages/EditProfile";
import FlightSearchResults from "./pages/FlightSearchResults";
import BusSearchResults from "./pages/BusSearchResults";
import PopularBusRoutesPage from "./pages/PopularBusRoutesPage";
import BusSeatSelectionPage from "./pages/BusSeatSelectionPage";
import BusPassengerDetailsPage from "./pages/BusPassengerDetailsPage";
import BusPaymentPage from "./pages/BusPaymentPage";
import FlightSeatSelectionPage from "./pages/FlightSeatSelectionPage";
import FlightPassengerDetailsPage from "./pages/FlightPassengerDetailsPage";
import FlightPaymentPage from "./pages/FlightPaymentPage";
import TicketConfirmationPage from "./pages/TicketConfirmationPage";
import MyAccount from "./pages/MyAccount";

import AdminLogin from "./Admin_Portal/AUTHENTICATIONS/login admin/login admin";
import AdminPin from "./Admin_Portal/AUTHENTICATIONS/verifing/adminpin";
import AdminTopbar from "./Admin_Portal/TOPBAR ADMIN/Topbar";
import AdminLayout from "./Admin_Portal/adminlayout";
import AdminSectionPlaceholder from "./Admin_Portal/PLACEHOLDERS/SectionPlaceholder";
import AdminDashboard from "./Admin_Portal/DASHBOARD ADMIN/Admin.Dashbaord";
import DiscountList from "./Admin_Portal/B2C BUS MANAGEMENT/Discount List/DiscountList";
import AddB2CBusDiscount from "./Admin_Portal/B2C BUS MANAGEMENT/Discount List/AddB2CBusDiscount";
import BusBookingList from "./Admin_Portal/B2C BUS MANAGEMENT/Booking List/bookingList";
import BusCancellationList from "./Admin_Portal/B2C BUS MANAGEMENT/Cancellation List/BusCancellationList";
import BusConvenienceFee from "./Admin_Portal/B2C BUS MANAGEMENT/convenience fee/BusConvenienceFee";
import BusEditConvenienceFee from "./Admin_Portal/B2C BUS MANAGEMENT/convenience fee/BusEditConvenienceFee";
import BusSearchHistory from "./Admin_Portal/B2C BUS MANAGEMENT/Search History/BusSearchHistory";
import BusVoucherSettings from "./Admin_Portal/B2C BUS MANAGEMENT/Vocher settings/BusVocherSettings";
import BusMarkupList from "./Admin_Portal/B2C BUS MANAGEMENT/MarkupList/BusMarkupList";
import BusCouponList from "./Admin_Portal/B2C BUS MANAGEMENT/Coupon list/BusCouponList";
import BusUsedCouponsList from "./Admin_Portal/B2C BUS MANAGEMENT/Used coupon list/BusUsedCouponsList";
import BusPopularRoutes from "./Admin_Portal/B2C BUS MANAGEMENT/Popular Bus Routes/PopularBusRoutes";
import FlightDiscountList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Discount List/DiscountList";
import FlightBookingList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Booking List/FlightBookingList";
import FlightCancelRequestList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Cancellation Request List/FlightCancelRequestList";
import FlightConvenienceFee from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Convenience fee/FlightConvenienceFee";
import FlightEditConvenienceFee from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Convenience fee/FlightEditConvenienceFee";
import FlightRemarkList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Remark List/FlightRemarkList";
import FlightRemarkEditList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Remark List/FlightRemarkEditList";
import FlightAmendmentsList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Amendments List/FlightAmendmentsList";
import FlightSearchHistory from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Flight Search History/FlightSearchHistory";
import PendingAirlinesList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Pending Airline List/PendingAirlinesList";
import PendingAirlinesEditList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Pending Airline List/PendingAirlinesEditList";
import FlightAllowedFareType from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Allowed Fare type/FlightAllowedFareType";
import AirlineWebCheckLink from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Airline Web Check Link/AirlineWebCheckLink";
import AirlineBrandList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/AIRLINE BRANDS/AirlineBrandList";
import FlightMarkupList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/B2C Flight Markup/FlightMarkupList";
import FlightCouponList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Coupon List/FlightCoupon";
import FlightUsedCouponList from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Used Coupon List/FlightUsedCoupon";
import FlightPopularRoutes from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Flight Popular Routes/FlightPopularRoutes";
import FlightPopularDestination from "./Admin_Portal/B2C FLIGHT MANAGEMENT/Popular Destinantion/FlightPopularDestination";
import TaxManagement from "./Admin_Portal/PAYMENT MANAGEMENT/Tax Management/TaxManagement";
import AllPages from "./Admin_Portal/PAGE MANAGEMENT/ALL PAGE LIST/AllPages";
import AddPage from "./Admin_Portal/PAGE MANAGEMENT/ADD NEW PAGE/AddPage";
import AdminMenuListPage from "./Admin_Portal/MENU MANAGEMENT/MENU LIST/MenuList";
import AdminMenuAddPage from "./Admin_Portal/MENU MANAGEMENT/ADD MENU/addmenu";
import AdminOfferListPage from "./Admin_Portal/OFFER MANAGEMENT/OFFER LIST/OfferList";
import AdminAddOfferPage from "./Admin_Portal/OFFER MANAGEMENT/ADD NEW OFFER/AddOffer";
import AdminOfferCategoryListPage from "./Admin_Portal/OFFER MANAGEMENT/OFFER CATEGORY LIST/OfferCategoryList";
import AdminAddOfferCategoryPage from "./Admin_Portal/OFFER MANAGEMENT/ADD OFFER CATEGORY/AddOfferCategory";
import PaymentSettings from "./Admin_Portal/PAYMENT MANAGEMENT/Payment Settings/payment Settings";
import AdminBlogList from "./Admin_Portal/BLOG MANAGEMENT/Blog List/Admin.Bloglist";
import AdminAddBlog from "./Admin_Portal/BLOG MANAGEMENT/ADD BLOG/Admin.Addblog";
import AdminBlogSubCategoryList from "./Admin_Portal/BLOG MANAGEMENT/BLOG SUB CATEGORY LIST/Admin.SubCategorylist";
import AdminAddBlogSubCategory from "./Admin_Portal/BLOG MANAGEMENT/ADD BLOG SUB CATEGORY/Admin.AddblogSubCategory";
import AdminBlogCategoryList from "./Admin_Portal/BLOG MANAGEMENT/BLOG CATEGORY LIST/Admin.BlogCategorylist";
import AdminAddBlogCategory from "./Admin_Portal/BLOG MANAGEMENT/ADD BLOG CATEGORY/Admin.Addblogcategory";
import AdminCustomerList from "./Admin_Portal/CUSTOMER MANAGEMENT/CUSTOMER LIST/Admin.Customerlist";
import AdminAddNewCustomer from "./Admin_Portal/CUSTOMER MANAGEMENT/ADD NEW CUSTOMER/Admin.AddNewCustomer";
import AdminDepositRequestList from "./Admin_Portal/CUSTOMER MANAGEMENT/DEPOSITE REQUEST LIST/Admin.Depositelist";

const ADMIN_PATHS = {
  base: "/admin",
  login: "/admin/login",
  pin: "/admin/pin",
};

const ADMIN_MENU_ROUTES = {
  list: "menu-management/menus",
  add: "menu-management/menus/new",
};

const ADMIN_MENU_PATHS = {
  list: `${ADMIN_PATHS.base}/${ADMIN_MENU_ROUTES.list}`,
  add: `${ADMIN_PATHS.base}/${ADMIN_MENU_ROUTES.add}`,
};

const ADMIN_OFFER_ROUTES = {
  list: "offer-management/offers",
  add: "offer-management/offers/new",
  categories: "offer-management/categories",
  addCategory: "offer-management/categories/new",
};

const ADMIN_OFFER_PATHS = {
  list: `${ADMIN_PATHS.base}/${ADMIN_OFFER_ROUTES.list}`,
  add: `${ADMIN_PATHS.base}/${ADMIN_OFFER_ROUTES.add}`,
  categories: `${ADMIN_PATHS.base}/${ADMIN_OFFER_ROUTES.categories}`,
  addCategory: `${ADMIN_PATHS.base}/${ADMIN_OFFER_ROUTES.addCategory}`,
};

const HIDE_TOPBAR_PATHS = new Set([
  "/login",
  "/register",
  "/verify",
  "/verify-otp",
  "/forget",
  "/forgot-password",
  "/reset-password",
  "/resetpassword",
]);

const LEGACY_REDIRECTS = [
  { from: "/Login", to: "/login" },
  { from: "/Register", to: "/register" },
  { from: "/Verify", to: "/verify" },
  { from: "/verify-otp", to: "/verify" },
  { from: "/Forget", to: "/forgot-password" },
  { from: "/forget", to: "/forgot-password" },
  { from: "/reset-password", to: "/forgot-password" },
  { from: "/resetpassword", to: "/forgot-password" },
  { from: "/Admin_login", to: ADMIN_PATHS.login },
  { from: "/Admin_Pin", to: ADMIN_PATHS.pin },
  { from: "/DataTable", to: "/data-table" },
];

const ADMIN_PLACEHOLDER_DESCRIPTION = "This module is getting configured.";

const adminPlaceholder = (title, description = ADMIN_PLACEHOLDER_DESCRIPTION) => (
  <AdminSectionPlaceholder title={title} description={description} />
);

function RequireAdmin({ children }) {
  const { token, adminRole } = useAuthSession();

  if (!token || !adminRole) {
    return <Navigate to={ADMIN_PATHS.login} replace />;
  }

  return children;
}

function RequireUser({ children }) {
  const { token, adminRole } = useAuthSession();

  if (!token || adminRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminMenuListRoute() {
  const navigate = useNavigate();

  return <AdminMenuListPage onAddMenu={() => navigate(ADMIN_MENU_PATHS.add)} />;
}

function AdminMenuAddRoute() {
  const navigate = useNavigate();

  return <AdminMenuAddPage onBack={() => navigate(ADMIN_MENU_PATHS.list)} />;
}

function AdminOfferListRoute() {
  const navigate = useNavigate();

  return <AdminOfferListPage onAddOffer={() => navigate(ADMIN_OFFER_PATHS.add)} />;
}

function AdminOfferAddRoute() {
  const navigate = useNavigate();

  return <AdminAddOfferPage onBack={() => navigate(ADMIN_OFFER_PATHS.list)} />;
}

function AdminOfferCategoryListRoute() {
  const navigate = useNavigate();

  return <AdminOfferCategoryListPage onAddCategory={() => navigate(ADMIN_OFFER_PATHS.addCategory)} />;
}

function AdminOfferCategoryAddRoute() {
  const navigate = useNavigate();

  return <AdminAddOfferCategoryPage onBack={() => navigate(ADMIN_OFFER_PATHS.categories)} />;
}

function AppContent() {
  const location = useLocation();
  const normalizedPath = (location.pathname || "").toLowerCase();
  const shouldHideTopbar =
    normalizedPath.startsWith("/admin") || HIDE_TOPBAR_PATHS.has(normalizedPath);

  return (
    <>
      {!shouldHideTopbar && <Topbar />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<Forgetpassword />} />

        <Route path="/web-checkin" element={<WebCheckinPage />} />
        <Route path="/fetch-ticket" element={<FetchTicket />} />
        <Route path="/print-ticket" element={<PrintTicketPage />} />
        <Route path="/search/flights" element={<FlightSearchResults />} />
        <Route path="/search/buses" element={<BusSearchResults />} />
        <Route path="/bus/seats" element={<BusSeatSelectionPage />} />
        <Route path="/bus/passenger-details" element={<BusPassengerDetailsPage />} />
        <Route path="/bus/payment" element={<BusPaymentPage />} />
        <Route path="/flight/seats" element={<FlightSeatSelectionPage />} />
        <Route path="/flight/passenger-details" element={<FlightPassengerDetailsPage />} />
        <Route path="/flight/payment" element={<FlightPaymentPage />} />
        <Route path="/ticket/confirmation" element={<TicketConfirmationPage />} />
        <Route path="/popular-buses/:operatorId" element={<PopularBusRoutesPage />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route path={ADMIN_PATHS.login} element={<AdminLogin />} />
        <Route path={ADMIN_PATHS.pin} element={<AdminPin />} />
        <Route
          path={ADMIN_PATHS.base}
          element={
            <RequireAdmin>
              <AdminLayout topbar={<AdminTopbar />} />
            </RequireAdmin>
          }
        >
          <Route
            index
            element={<AdminDashboard />}
          />
          <Route path="b2c-bus/discounts" element={<DiscountList />} />
          <Route path="b2c-bus/discounts/new" element={<AddB2CBusDiscount />} />
          <Route path="b2c-bus/booking-list" element={<BusBookingList />} />
          <Route path="b2c-bus/cancellation-list" element={<BusCancellationList />} />
          <Route path="b2c-bus/convenience-fee" element={<BusConvenienceFee />} />
          <Route path="b2c-bus/convenience-fee/edit" element={<BusEditConvenienceFee />} />
          <Route path="b2c-bus/search-history" element={<BusSearchHistory />} />
          <Route path="b2c-bus/voucher-settings" element={<BusVoucherSettings />} />
          <Route path="b2c-bus/markup-list" element={<BusMarkupList />} />
          <Route path="b2c-bus/coupon-list" element={<BusCouponList />} />
          <Route path="b2c-bus/used-coupon-list" element={<BusUsedCouponsList />} />
          <Route path="b2c-bus/popular-routes" element={<BusPopularRoutes />} />
          <Route path="page-management/pages" element={<AllPages />} />
          <Route path="page-management/pages/new" element={<AddPage />} />
          <Route path={ADMIN_MENU_ROUTES.list} element={<AdminMenuListRoute />} />
          <Route path={ADMIN_MENU_ROUTES.add} element={<AdminMenuAddRoute />} />
          <Route path={ADMIN_OFFER_ROUTES.list} element={<AdminOfferListRoute />} />
          <Route path={ADMIN_OFFER_ROUTES.add} element={<AdminOfferAddRoute />} />
          <Route path={ADMIN_OFFER_ROUTES.categories} element={<AdminOfferCategoryListRoute />} />
          <Route path={ADMIN_OFFER_ROUTES.addCategory} element={<AdminOfferCategoryAddRoute />} />
          <Route path="AllPages" element={<Navigate to="page-management/pages" replace />} />
          <Route path="AddPage" element={<Navigate to="page-management/pages/new" replace />} />
          <Route path="b2c-bus/*"
            element={adminPlaceholder("B2C Bus Management")}
          />
          <Route path="b2c-flight/discounts" element={<FlightDiscountList />} />
          <Route
            path="b2c-flight/discounts/new"
            element={adminPlaceholder("Add B2C Flight Discount")}
          />
          <Route path="b2c-flight/booking-list" element={<FlightBookingList />} />
          <Route path="b2c-flight/cancellation-requests" element={<FlightCancelRequestList />} />
          <Route path="b2c-flight/convenience-fee" element={<FlightConvenienceFee />} />
          <Route path="b2c-flight/convenience-fee/add" element={<FlightEditConvenienceFee />} />
          <Route path="b2c-flight/convenience-fee/edit" element={<FlightEditConvenienceFee />} />
          <Route path="b2c-flight/remark-list" element={<FlightRemarkList />} />
          <Route path="b2c-flight/remark-list/add" element={<FlightRemarkEditList />} />
          <Route path="b2c-flight/remark-list/edit" element={<FlightRemarkEditList />} />
          <Route path="b2c-flight/amendments" element={<FlightAmendmentsList />} />
          <Route path="b2c-flight/allowed-fare-types" element={<FlightAllowedFareType />} />
          <Route path="b2c-flight/search-history" element={<FlightSearchHistory />} />
          <Route path="b2c-flight/pending-airlines" element={<PendingAirlinesList />} />
          <Route path="b2c-flight/pending-airlines/add" element={<PendingAirlinesEditList />} />
          <Route path="b2c-flight/pending-airlines/edit" element={<PendingAirlinesEditList />} />
          <Route path="b2c-flight/airline-webcheck-links" element={<AirlineWebCheckLink />} />
          <Route path="b2c-flight/airline-brands" element={<AirlineBrandList />} />
          <Route path="b2c-flight/markup" element={<FlightMarkupList />} />
          <Route path="b2c-flight/coupon-list" element={<FlightCouponList />} />
          <Route path="b2c-flight/used-coupon-list" element={<FlightUsedCouponList />} />
          <Route path="b2c-flight/popular-routes" element={<FlightPopularRoutes />} />
          <Route path="b2c-flight/popular-destinations" element={<FlightPopularDestination />} />
          <Route
            path="b2c-flight/*"
            element={adminPlaceholder("B2C Flight Management")}
          />
          <Route path="payment-management/tax-management" element={<TaxManagement />} />
          <Route path="payment-management/payment-setting" element={<PaymentSettings />} />
          {/* Account Management */}
          <Route path="account-management/transaction-log" element={adminPlaceholder("Transaction Log")} />
          <Route path="account-management/bank-list" element={adminPlaceholder("Bank List")} />
          <Route path="account-management/qrcode-list" element={adminPlaceholder("QR Code List")} />
          <Route path="account-management/payment-upload" element={adminPlaceholder("Payment Upload")} />
          <Route path="account-management/payment-upload-list" element={adminPlaceholder("Payment Upload List")} />
          <Route path="account-management/balance-sheet" element={adminPlaceholder("Balance Sheet")} />
          {/* Blog Management */}
          <Route path="blog-management/blog-list" element={<AdminBlogList />} />
          <Route path="blog-management/add-blog" element={<AdminAddBlog />} />
          <Route path="blog-management/edit-blog/:blogId" element={<AdminAddBlog />} />
          <Route path="blog-management/blog-sub-category-list" element={<AdminBlogSubCategoryList />} />
          <Route path="blog-management/add-blog-sub-category" element={<AdminAddBlogSubCategory />} />
          <Route path="blog-management/blog-category-list" element={<AdminBlogCategoryList />} />
          <Route path="blog-management/add-blog-category" element={<AdminAddBlogCategory />} />
          {/* Customer Management */}
          <Route path="customer-management/customer-list" element={<AdminCustomerList />} />
          <Route path="customer-management/add-new-customer" element={<AdminAddNewCustomer />} />
          <Route path="customer-management/deposit-request-list" element={<AdminDepositRequestList />} />
          {/* Query Management */}
          <Route path="query-management/query-list" element={adminPlaceholder("Query List")} />
          {/* Security Management */}
          <Route path="security-management/black-list-ip" element={adminPlaceholder("Black List IP")} />
          <Route path="security-management/white-list-ip" element={adminPlaceholder("White List IP")} />
          {/* Site Management */}
          <Route path="site-management/site-setting" element={adminPlaceholder("Site Setting")} />
          <Route path="site-management/social-links" element={adminPlaceholder("Social Links")} />
          <Route path="site-management/slider-image" element={adminPlaceholder("Slider Image")} />
          <Route path="site-management/add-home-slider-image" element={adminPlaceholder("Add Home Slider Image")} />
          <Route path="site-management/home-slider-2-image" element={adminPlaceholder("Home Slider 2 Image")} />
          <Route path="site-management/add-home-slider-2-image" element={adminPlaceholder("Add Home Slider 2 Image")} />
          <Route path="site-management/manual-booking-supplier" element={adminPlaceholder("Manual Booking Supplier")} />
          <Route path="site-management/meta-data-list" element={adminPlaceholder("Meta Data List")} />
          <Route path="site-management/seo-link-list" element={adminPlaceholder("SEO Link List")} />
          {/* Testimonial Management */}
          <Route path="testimonial-management/testimonial-list" element={adminPlaceholder("Testimonial List")} />
          <Route path="testimonial-management/add-testimonial" element={adminPlaceholder("Add Testimonial")} />
          {/* Theme Management */}
          <Route path="theme-management/b2c-header-theme" element={adminPlaceholder("B2C Header Theme")} />
          <Route path="theme-management/b2c-home-theme" element={adminPlaceholder("B2C Home Theme")} />
          <Route path="theme-management/b2c-footer-theme" element={adminPlaceholder("B2C Footer Theme")} />
          <Route path="theme-management/themes-list" element={adminPlaceholder("Themes List")} />
          <Route
            path="placeholder"
            element={adminPlaceholder(
              "Module Coming Soon",
              "This admin module is not wired yet."
            )}
          />
          <Route path="*" element={<Navigate to={ADMIN_PATHS.base} replace />} />
        </Route>

        <Route path="/data-table" element={<DataTable />} />
        <Route
          path="/dashboard"
          element={
            <RequireUser>
              <DashboardLayout />
            </RequireUser>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="bank-list" element={<BankList />} />
          <Route path="qr-list" element={<QRList />} />
          <Route path="deposit-request" element={<DepositRequest />} />
          <Route path="traveler-list" element={<TravelerList />} />
          <Route path="flight-bookings" element={<FlightBookings />} />
          <Route path="flight-cancel" element={<FlightCancel />} />
          <Route path="bus-bookings" element={<BusBookings />} />
          <Route path="bus-cancel" element={<BusCancel />} />
          <Route path="account-statement" element={<AccountStatement />} />
          <Route path="my-account" element={<MyAccount />} />
          <Route path="edit-profile" element={<Navigate to="/edit-profile" replace />} />
          <Route path="change-password" element={<Navigate to="/change-password" replace />} />
        </Route>

        {LEGACY_REDIRECTS.map((route) => (
          <Route
            key={route.from}
            path={route.from}
            element={<Navigate to={route.to} replace />}
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;

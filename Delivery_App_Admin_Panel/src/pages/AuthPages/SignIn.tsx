import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Admin Sign In | Delivery App"
        description="Admin panel sign in for delivery management"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}

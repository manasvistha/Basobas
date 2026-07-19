import Image from "next/image";
import LoginForm from "../_components/login_form";

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-logo">
          <Image
            src="/Logo.png"
            alt="Logo.png"
            width={150}
            height={80}
            priority
          />
        </div>
        <Image
          src="/illustration.png"
          alt="Login Illustration"
          fill
          priority
          className="login-illustration"
        />
      </div>
      <LoginForm />
    </div>
  );
}

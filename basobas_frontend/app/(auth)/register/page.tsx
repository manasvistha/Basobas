import Image from "next/image";
import RegisterForm from "../_components/signup_form";

export default function RegisterPage() {
  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-logo">
          <Image
            src="/Logo.png"
            alt="Logo.png"
            width={220}
            height={80}
            priority
          />
        </div>

        <Image
          src="/illustration.png"
          alt="Signup Illustration"
          fill
          priority
          className="login-illustration"
        />
      </div>
      <RegisterForm />
    </div>
  );
}
